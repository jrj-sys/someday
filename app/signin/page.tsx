import SignInForm from './signin-form'
import styles from './signin.module.css'

export default function SignInPage() {
  return (
    <main className={styles.page}>
      <SignInForm />
    </main>
  )
}
