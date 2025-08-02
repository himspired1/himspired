import { Metadata } from "next";
import AboutPage from "./about-page";

export const metadata: Metadata = {
  title: "About Us - Our Story & Mission",
  description:
    "Learn about Himspired's journey from thrift to luxury fashion. Discover our mission to make premium fashion accessible to everyone through curated collections.",
  keywords: [
    "about us",
    "our story",
    "mission",
    "fashion brand",
    "thrift luxury",
    "premium fashion",
  ],
  openGraph: {
    title: "About Us - Our Story & Mission | Himspired",
    description:
      "Learn about Himspired's journey from thrift to luxury fashion. Discover our mission to make premium fashion accessible to everyone.",
    url: "https://himspired.vercel.app/about",
  },
  twitter: {
    title: "About Us - Our Story & Mission | Himspired",
    description:
      "Learn about Himspired's journey from thrift to luxury fashion. Discover our mission to make premium fashion accessible to everyone.",
  },
};

export default function About() {
  return <AboutPage />;
}
