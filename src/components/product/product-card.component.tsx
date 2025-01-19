import Image from "next/image";
import { P } from "../common/typography";
import { Plus } from "lucide-react";

interface ProductProps {
    className?: string;
    title: string;
    image: string;
    category: string;
    price: string
}

const ProductCard = ({ title, className, category, price, image }: ProductProps) => {
    return (
        <>
            <div className={`${className} w-[25%] mb-[70px]`} >
                <div className="w-full flex items-center justify-center" >
                    <Image alt={title} src={image} />
                </div>
                <div className="w-full mt-[38px]" >
                    <P className="text-[12px] font-normal text-[#1E1E1ECC] text-center" >{category}</P>
                    <P className="text-[16px] font-normal text-[#000] text-center mt-[8px]" >{title}</P>
                    <P className="text-[16px] font-normal text-[#000] text-center mt-[8px]" >{`N${price}`}</P>
                </div>
                <div className="w-full flex items-center justify-center mt-[26px]" >
                    <div className=" w-[48px] cursor-pointer h-[48px] rounded-full flex items-center justify-center bg-[#F4F4F4]">
                        <Plus size={14} color="#1E1E1E" />
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProductCard;