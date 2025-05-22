import Fashion from "./_Home/components/Fashion";
import Newsletter from "./_Home/components/Newsletter";
import Owners from "./_Home/components/Owners";
import Products from "./_Home/components/Products";


export default function Home() {
  return (
    <div className="font-activo">
      <Products/>
      <Owners />
      <Fashion />
      <Newsletter />
    </div>
  );
}
