import Fashion from "./_Home/components/Fashion";
import Newsletter from "./_Home/components/Newsletter";
import Owners from "./_Home/components/Owners";
import MainSection from "./_Home/components/ScrollSection";

export default function Home() {
  return (
    <div className="font-activo">
      <MainSection />
      <Fashion />
      <Owners />
      <Newsletter />
    </div>
  );
}
