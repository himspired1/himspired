import { H, P } from "@/components/common/typography";

const Empowering = () => {
    return (
        <div className="w-full  px-[120px] relative h-[215px] " >
            <div className="w-full flex  items-center justify-between h-full relative">
                <div className="w-[60%] h-full" >
                    <h1 className=" text-[40px] font-moon font-bold">
                        Empowering Style,
                        <span className=" text-grey">Inspiring Confidence</span>
                    </h1>
                </div>
                <div className="w-[40%] flex items-end h-full relative">
                    <p className="  text-[#1E1E1E] leading-[23px] mt-[50px] text-[18px] font-kiona font-normal">
                        At <span className=" text-[#68191E]" >Himspired</span>, we merge timeless fashion with modern trends to create
                        pieces that reflect individuality, quality, and elegance. Every
                        stitch tells a story, and every piece is crafted to inspire your
                        journey.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Empowering;
