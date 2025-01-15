import Navbar from "@/components/navbar";
import Image from "next/image";
import Carousel from "./_Home/components/ImageStack";
import Newsletter from "./_Home/components/Newsletter";

export default function Home() {
  return (
    <div>
      <Carousel />
      <Newsletter />
    </div>
  );
}
