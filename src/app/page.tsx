import Fashion from "./_Home/components/Fashion";
import Newsletter from "./_Home/components/Newsletter";
import Owners from "./_Home/components/Owners";

export default function Home() {
  return (
    <div className="font-activo">
      <Fashion />
      <Owners />
      <Newsletter />
    </div>
  );
}
