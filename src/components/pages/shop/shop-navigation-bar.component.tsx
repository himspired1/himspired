'use client'

import { useEffect, useRef, useState, useMemo } from "react";

interface Props {
  activeTab: string,
  setActiveTab: (tab: string) => void
}

const ShopNavigationBar = ({ activeTab, setActiveTab }: Props) => {
  const [tabPositions, setTabPositions] = useState({ width: 0, left: 0 });
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  const links = useMemo(() => [
    {
      name: "ALL",
      value: "all"
    },
    {
      name: "THRIFT",
      value: "thrift"
    },
    {
      name: "LUXURY",
      value: "luxury"
    },
    {
      name: "SENATORS",
      value: "senetors"
    },
  ], []);
  
  useEffect(() => {
    const activeIndex = links.findIndex(link => link.value === activeTab);
    if (tabRefs.current[activeIndex]) {
      const activeTabElement = tabRefs.current[activeIndex];
      if (activeTabElement) {
        setTabPositions({
          width: activeTabElement.offsetWidth,
          left: activeTabElement.offsetLeft
        });
      }
    }
  }, [activeTab, links]);
  
  return (
    <>
      <div className="w-full mt-[120px] lg:mt-[141.5px] px-[120px]" >
        <div className="w-full " >
          <div className=" flex items-center justify-center " >
            <ul className="w-[383px] flex items-center justify-between bg-[#F7F7F7] rounded-[100px] p-[4px] relative" >
              {/* Animated background */}
              <div 
                className="absolute bg-white rounded-[100px] h-[23px] transition-all duration-300 ease-in-out"
                style={{
                  width: `${tabPositions.width}px`,
                  left: `${tabPositions.left}px`,
                }}
              />
              
              {links.map(({ name, value }, index) => (
                <div 
                  ref={el => { tabRefs.current[index] = el; }}
                  onClick={() => {
                    setActiveTab(value)
                  }} 
                  key={value} 
                  className={`w-min-[49px] rounded-[100px] h-[23px] cursor-pointer px-[12px] py-[4px] flex items-center justify-center z-10`} 
                >
                  <p style={{ fontFamily: "activo" }} className=" text-[#1E1E1ECC] text-xs md:text- font-normal text-center cursor-pointer" >{name}</p>
                </div>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
export default ShopNavigationBar;
