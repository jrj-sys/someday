import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image src="/logo.svg" alt="Someday logo" width={100} height={100} priority />
        <div className={styles.intro}>
          <h1>Someday you&apos;ll go there.</h1>
          <p>Want to know where to go next or keep up with where you or your friends have been? Someday is your travel journal for the modern age.</p>
        </div>
        <br />
        <Link href="/globe" className={styles.button}>See the globe</Link>
      </main>
    </div>
  );
}
