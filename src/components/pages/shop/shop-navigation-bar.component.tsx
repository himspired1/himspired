"use client"
import { Link, P } from "@/components/common/typography";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
interface Props {
    activeTab: string,
    setActiveTab: any
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
    ]

    const goBack = useRouter().push
    return (
        <>
            <div className="w-full mt-[41.5px] px-[120px]" >
                <div className="w-full flex items-center justify-between" >
                    <div className="w-[10%] flex items-center justify-start gap-3" >
                        <ChevronLeft className="cursor-pointer" onClick={() => {
                            goBack("/")
                        }} size={16} />
                        <Link onClick={() => {
                            goBack("/")
                        }} fontFamily="kiona" className="font-normal text-[14px] text-[black] hover:text-black no-underline" >Home</Link>
                    </div>

                    <div className="w-[90%] flex items-center justify-center " >
                        <ul className="w-[383px] flex items-center justify-between bg-[#F7F7F7] rounded-[100px] p-[4px]" >

                            {links.map(({ name, value }) => (
                                <div onClick={() => {
                                    setActiveTab(value)
                                }} key={value} className={` w-min-[49px] ${activeTab === value ? "bg-white" : "bg-transparent"} rounded-[100px] h-[23px] cursor-pointer px-[12px] py-[4px] flex items-center justify-center`} >
                                    <P fontFamily="kiona" className=" text-[#1E1E1ECC] text-[12px] font-normal text-center cursor-pointer" >{name}</P>
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