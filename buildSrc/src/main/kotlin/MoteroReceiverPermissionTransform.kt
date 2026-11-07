import com.android.build.api.instrumentation.AsmClassVisitorFactory
import com.android.build.api.instrumentation.ClassContext
import com.android.build.api.instrumentation.ClassData
import com.android.build.api.instrumentation.InstrumentationParameters
import org.objectweb.asm.ClassVisitor
import org.objectweb.asm.FieldVisitor
import org.objectweb.asm.Handle
import org.objectweb.asm.MethodVisitor
import org.objectweb.asm.Opcodes

/**
 * Give AndroidX's API 28-32 receiver backport a permission owned by the new key.
 * Re-declaring the legacy permission would require trusting the public old key
 * for signature permissions, even though the app-data rotation is valid.
 */
abstract class MoteroReceiverPermissionTransform :
    AsmClassVisitorFactory<InstrumentationParameters.None> {
    override fun isInstrumentable(classData: ClassData) =
        classData.className == "androidx.core.content.ContextCompat"

    override fun createClassVisitor(classContext: ClassContext, nextClassVisitor: ClassVisitor): ClassVisitor =
        object : ClassVisitor(Opcodes.ASM9, nextClassVisitor) {
            private fun replace(value: Any?): Any? = if (value is String) {
                value.replace(
                    ".DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION",
                    ".MOTERO_DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
                )
            } else value

            override fun visitField(access: Int, name: String, descriptor: String, signature: String?, value: Any?): FieldVisitor? =
                super.visitField(access, name, descriptor, signature, replace(value))

            override fun visitMethod(access: Int, name: String, descriptor: String, signature: String?, exceptions: Array<out String>?): MethodVisitor =
                object : MethodVisitor(Opcodes.ASM9, super.visitMethod(access, name, descriptor, signature, exceptions)) {
                    override fun visitLdcInsn(value: Any?) = super.visitLdcInsn(replace(value))

                    override fun visitInvokeDynamicInsn(name: String, descriptor: String, bootstrapMethodHandle: Handle, vararg bootstrapMethodArguments: Any?) =
                        super.visitInvokeDynamicInsn(name, descriptor, bootstrapMethodHandle, *bootstrapMethodArguments.map { replace(it) }.toTypedArray())
                }
        }
}
