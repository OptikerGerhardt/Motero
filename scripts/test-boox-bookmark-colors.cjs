const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../build/android');
const fixture = path.resolve(__dirname, '../test/fixtures/boox-fitting.pdf');
const types = {'.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
    '.css':'text/css', '.pdf':'application/pdf', '.wasm':'application/wasm'};
const palette = ['#ffd400', '#ff6666', '#5fb236', '#2ea8e5', '#a28ae5', '#e56eee', '#f19837', '#aaaaaa', '#000000'];

(async () => {
    const server = http.createServer((request, response) => {
        const location = new URL(request.url, 'http://localhost').pathname;
        const file = location === '/fixture.pdf' ? fixture : path.join(root, location);
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
            response.writeHead(404).end();
            return;
        }
        response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
        fs.createReadStream(file).pipe(response);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await chromium.launch({ executablePath: process.env.BOOX_TEST_BROWSER,
            args: ['--no-sandbox', '--disable-dev-shm-usage'] });
        const page = await browser.newPage({viewport:{width:600,height:800}, isMobile:true, hasTouch:true});
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.stack));
        const cdp = await page.context().newCDPSession(page);
        const pen = (type, x, y) => cdp.send('Input.dispatchMouseEvent', {
            type, x, y, button:'left', pointerType:'pen', clickCount:1,
            buttons:type === 'mousePressed' ? 1 : 0, force:type === 'mousePressed' ? 0.5 : 0,
        });
        const touch = (type, points=[]) => cdp.send('Input.dispatchTouchEvent', {
            type, touchPoints: points.map((point, index) => ({...point, id:index+1, radiusX:2, radiusY:2})),
        });
        const origin = 'http://127.0.0.1:' + server.address().port;
        const frame = page.frameLocator('#view iframe');
        const ribbon = frame.locator('.motero-bookmark-ribbon');
        const settled = () => page.waitForFunction(() => {
            const v = window._view?._view, fit = v?._pageFitting;
            return fit?.applied && !fit.pendingPage && !fit.applying && !v._scrolling;
        });
        const annotations = () => page.evaluate(() => window._view._view._annotations);
        const centered = () => page.evaluate(() => window._view._view._booxReader.bookmarkPageIndex());
        const saved = () => page.evaluate(() => window.messages.filter(x => x.message?.event === 'onSaveAnnotations'));
        const corner = () => page.evaluate(() => {
            const v = window._view._view, r = v._pageFitting.viewer.container.getBoundingClientRect();
            const frame = v._iframe.getBoundingClientRect();
            return {x: frame.x+r.right-18, y:frame.y+r.top+45};
        });
        async function open(options={}) {
            await page.goto(origin + '/view.html');
            await page.evaluate(() => {
                window.messages = [];
                const c = new MessageChannel();
                c.port1.onmessage = event => window.messages.push(JSON.parse(event.data));
                window.postMessage('initPort', '*', [c.port2]);
            });
            await page.waitForFunction(() => window.messages.some(x => x.message?.event === 'onInitialized'));
            await page.evaluate(options => window.createView(btoa(JSON.stringify(options))), {
                type:'pdf', url:origin+'/fixture.pdf', annotations:[], directHighlight:true,
                bookmarkColor:'#ffd400', indicatorInsets:{top:30,right:10,bottom:24},
                viewState:{pageIndex:4,scale:'page-width',scrollMode:0,spreadMode:0},
                pageFitting:{mode:'width',reference:'cropped-content',margin:0,cropMode:'manual',manualCrop:{all:[0,0,1,1]}},
                ...options,
            });
            await settled();
        }
        async function longPress() {
            await touch('touchStart', [await corner()]);
            await ribbon.waitFor({state:'visible'});
            await touch('touchEnd');
            assert.equal(await ribbon.count(), 1, 'releasing the long press keeps the picker open');
        }
        async function pick(color) {
            await ribbon.locator('button[data-color="'+color+'"]').tap();
            await ribbon.waitFor({state:'detached'});
        }

        await open();
        const pageIndex = await centered();
        await longPress();
        assert.deepEqual(await ribbon.locator('button').evaluateAll(items => items.map(item => item.dataset.color)), palette);
        assert.equal(await ribbon.getAttribute('data-instant'), null);
        await page.waitForFunction(() => window.messages.some(x => x.message?.event === 'onBookmarkColorsOpen'
            && x.message.params.open));
        assert.equal((await annotations()).length, 0, 'long press by itself does not create a bookmark');
        await pick('#2ea8e5');
        await page.waitForFunction(() => window._view._view._annotations[0]?.color === '#2ea8e5');
        const [original] = await annotations();
        assert.equal(original.position.pageIndex, pageIndex);
        assert.equal(original.tags[0].name, 'Bookmark');
        await page.waitForFunction(() => window.messages.some(x => x.message?.event === 'onSaveAnnotations'
            && x.message.params.annotations.some(annotation => annotation.color === '#2ea8e5')));
        console.log('PASS long press, nine Zotero swatches, selected-color creation and persistence bridge');

        await page.evaluate(id => window._view._view._onUpdateAnnotations([{id,
            comment:'My own note', tags:[{name:'Bookmark'},{name:'Research'}]}]), original.id);
        await longPress();
        assert.equal(await ribbon.locator('button[aria-pressed="true"]').getAttribute('data-color'), '#2ea8e5');
        await pick('#5fb236');
        const [updated] = await annotations();
        assert.equal(updated.id, original.id);
        assert.equal(updated.color, '#5fb236');
        assert.equal(updated.comment, 'My own note');
        assert.deepEqual(updated.tags.map(tag => tag.name), ['Bookmark','Research']);
        assert.deepEqual(updated.position, original.position);
        assert.equal(updated.dateCreated, original.dateCreated);
        assert.equal(await page.evaluate(() => window._view._view._options.bookmarkColor), '#ffd400');
        await page.waitForFunction(() => window.messages.some(x => x.message?.event === 'onSaveAnnotations'
            && x.message.params.annotations.some(annotation => annotation.color === '#5fb236')));
        const saves = (await saved()).length;
        await longPress();
        await pick('#5fb236');
        assert.equal((await saved()).length, saves, 'choosing the current color does not save again');
        await longPress();
        await page.evaluate(() => window.dismissBookmarkColors());
        await ribbon.waitFor({state:'detached'});
        await page.waitForFunction(() => window.messages.filter(x => x.message?.event === 'onBookmarkColorsOpen')
            .at(-1)?.message.params.open === false);
        await longPress();
        await page.keyboard.press('Escape');
        await ribbon.waitFor({state:'detached'});
        await longPress();
        await page.touchscreen.tap(50, 230);
        await ribbon.waitFor({state:'detached'});
        assert.equal((await saved()).length, saves);
        console.log('PASS recolor preserves content/default and Back, Escape, outside tap and same color cause no writes');
        await page.evaluate(() => window.setDeviceProfile({penOnly:true}));
        await longPress();
        const purple = await ribbon.locator('button[data-color="#a28ae5"]').boundingBox();
        const penX = purple.x+purple.width/2, penY = purple.y+purple.height/2;
        await pen('mousePressed', penX, penY);
        await pen('mouseReleased', penX, penY);
        await ribbon.waitFor({state:'detached'});
        assert.deepEqual((await annotations()).map(a => [a.type,a.color]), [['note','#a28ae5']]);
        console.log('PASS real pen can choose a swatch without drawing or taking over the control');

        await page.setViewportSize({width:800,height:315});
        await open({deviceProfile:{eReader:true},viewState:{pageIndex:4,scale:'page-width',scrollMode:0,spreadMode:1}});
        const spreadIndex = await centered();
        await longPress();
        const layout = await ribbon.evaluate(flag => {
            const w = flag.ownerDocument.defaultView;
            const r = flag.getBoundingClientRect();
            const rail = flag.querySelector('.motero-bookmark-ribbon-colors');
            return {top:r.top, bottom:r.bottom, right:r.right, width:r.width, clip:w.getComputedStyle(flag).clipPath, innerClip:w.getComputedStyle(rail).clipPath,
                transition:w.getComputedStyle(flag).transitionDuration,
                viewport:w.innerHeight, button:rail.firstElementChild.getBoundingClientRect().height,
                scrollable:rail.scrollHeight>rail.clientHeight, swatch:rail.querySelector('span').offsetWidth};
        });
        assert.equal(layout.transition, '0s');
        assert.ok(layout.top >= 0 && layout.bottom <= layout.viewport-24 && layout.right <= 800 - 16);
        assert.equal(layout.width, 44);
        assert.match(layout.innerClip, /^polygon\(/);
        assert.match(layout.clip, /^polygon\(/);
        assert.equal(layout.button, 44);
        assert.equal(layout.swatch, 24);
        assert.equal(layout.scrollable, true);
        if (process.env.MOTERO_BOOKMARK_SCREENSHOT) await page.screenshot({path:process.env.MOTERO_BOOKMARK_SCREENSHOT});
        await pick('#000000');
        await page.waitForFunction(() => window._view._view._annotations[0]?.color === '#000000');
        assert.equal((await annotations())[0].position.pageIndex, spreadIndex);
        console.log('PASS instant E-Ink with clipped, scrollable swatches on a short spread');

        await open({deviceProfile:{penOnly:false}});
        const point = await corner();
        await pen('mousePressed', point.x, point.y);
        await ribbon.waitFor({state:'visible'});
        await pen('mouseReleased', point.x, point.y);
        assert.equal((await annotations()).length, 0);
        await pick('#a28ae5');
        assert.deepEqual((await annotations()).map(a => [a.type,a.color]), [['note','#a28ae5']]);
        console.log('PASS immediately choosing with touch after opening the flag with the pen');

        await open({readOnly:true});
        await touch('touchStart',[await corner()]);
        await page.waitForTimeout(530);
        await touch('touchEnd');
        assert.equal(await ribbon.count(), 0);
        assert.equal((await annotations()).length, 0);
        await open();
        const start = await corner();
        await touch('touchStart',[start]);
        await touch('touchMove',[{x:start.x-32,y:start.y+16}]);
        await touch('touchCancel');
        await page.waitForTimeout(490);
        assert.equal(await ribbon.count(), 0);
        assert.equal((await annotations()).length, 0);
        assert.deepEqual(errors, []);
        console.log('PASS read-only and cancelled gestures remain side-effect free');
    }
    finally {
        await browser?.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
