import "../styles/globals.css";
import AmbienteBanner from "../components/AmbienteBanner";

export default function App({ Component, pageProps }) {
  return (
    <>
      <AmbienteBanner />
      <Component {...pageProps} />
    </>
  );
}
