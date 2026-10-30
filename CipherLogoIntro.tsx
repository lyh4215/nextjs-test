import styles from "./CipherLogoIntro.module.css";

// Geometry copied from the approved Centered Final logo.
// Animate only the SVG elements; its resting state stays identical.
export default function CipherLogoIntro({ size = 192 }: { size?: number }) {
  return (
    <div className={styles.logo}>
      <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" width={size} height={size} role="img" aria-label="암호 해독 서비스 로고">
<defs><linearGradient id="noteLine1" x1="26.0" y1="46.6" x2="74.0" y2="33.4" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#9DC8FE"/><stop offset="1" stopColor="#89B8FC"/></linearGradient>
<linearGradient id="noteLine2" x1="26.5" y1="62.6" x2="74.5" y2="49.4" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#91BEFC"/><stop offset="1" stopColor="#7CACFA"/></linearGradient>
<linearGradient id="noteLine3" x1="27.0" y1="78.6" x2="75.0" y2="65.4" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#80B2FA"/><stop offset="1" stopColor="#6CA0F8"/></linearGradient>
<linearGradient id="noteLine4" x1="27.5" y1="94.6" x2="75.5" y2="81.4" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#70A5F8"/><stop offset="1" stopColor="#5F95F6"/></linearGradient></defs>
<g className={styles.back}><path d="M10 35 Q10 26 19 23 L77 7 Q89 4 90 17 L90 93 Q90 102 82 105 L24 122 Q13 125 12 112Z" fill="#DCEBFF"/></g>
<g fill="none" strokeWidth="6.6" strokeLinecap="round"><path className={`${styles.noteLine} ${styles.noteLine1}`} d="M26.0 46.6 L74.0 33.4" stroke="url(#noteLine1)"/>
<path className={`${styles.noteLine} ${styles.noteLine2}`} d="M26.5 62.6 L74.5 49.4" stroke="url(#noteLine2)"/>
<path className={`${styles.noteLine} ${styles.noteLine3}`} d="M27.0 78.6 L75.0 65.4" stroke="url(#noteLine3)"/>
<path className={`${styles.noteLine} ${styles.noteLine4}`} d="M27.5 94.6 L75.5 81.4" stroke="url(#noteLine4)"/></g>
<g className={styles.front}><path d="M43 54 Q43 45 52 42 L107 27 Q118 24 119 36 L119 101 Q119 110 110 113 L57 125 Q46 128 44 116Z" fill="#435BF5"/></g>
<g fill="none" stroke="#FFFFFF" strokeWidth="4.3" strokeLinecap="round" strokeLinejoin="round"><g className={`${styles.star} ${styles.star1}`}><g transform="translate(65 82) skewY(-15.4)"><path d="M0 -6.5 V6.5 M-5.6 -3.3 L5.6 3.3 M-5.6 3.3 L5.6 -3.3"/></g></g>
<g className={`${styles.star} ${styles.star2}`}><g transform="translate(84 76.8) skewY(-15.4)"><path d="M0 -6.5 V6.5 M-5.6 -3.3 L5.6 3.3 M-5.6 3.3 L5.6 -3.3"/></g></g>
<g className={`${styles.star} ${styles.star3}`}><g transform="translate(103 71.6) skewY(-15.4)"><path d="M0 -6.5 V6.5 M-5.6 -3.3 L5.6 3.3 M-5.6 3.3 L5.6 -3.3"/></g></g></g>
</svg>
    </div>
  );
}
