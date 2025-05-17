"use client";
import { P } from "@/components/common/typography";

interface Props {
  activeTab: string;
  setActiveTab: (value: string) => void; // Improved type definition
}

const ShopNavigationBar = ({ activeTab, setActiveTab }: Props) => {
  const links = [
    {
      name: "All",
      value: "all"
    },
    {
      name: "Thrift",
      value: "thrift"
    },
    {
      name: "Luxury",
      value: "luxury"
    },
    {
      name: "Senetors",
      value: "senetors"
    },
  ];

  return (
    <nav className="w-full flex justify-center mt-10">
      <div className="bg-[#F7F7F7] rounded-[100px] p-1">
        <ul className="flex items-center gap-1 relative">
          {links.map(({ name, value }) => (
            <li key={value}>
              <button
                onClick={() => setActiveTab(value)}
                className={`
                  relative px-6 py-[6px] rounded-[100px] transition-all duration-300
                  ${activeTab === value 
                    ? "bg-white shadow-sm transform scale-105" 
                    : "hover:bg-white/30"
                  }
                `}
              >
                <P 
                  fontFamily="kiona" 
                  className={`
                    text-[#1E1E1ECC] text-sm font-normal transition-colors duration-300
                    ${activeTab === value ? "text-black" : "text-gray-600"}
                  `}
                >
                  {name}
                </P>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default ShopNavigationBar;