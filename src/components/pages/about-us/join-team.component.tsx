import { H, P } from "@/components/common/typography";
import { ArrowRight } from "lucide-react";

const JoinTheTeam = () => {
    return (
        <div className="w-full mt-[120px]  px-[120px] relative" >
            <div className="w-full flex  items-start justify-between h-full relative">
                <div className="w-[60%] h-full" >
                    <H fontFamily="moon" className=" text-[28px] uppercase">
                        Be part of the  <span className=" text-primary">Himspired</span><br/>team
                    </H>
                </div>
                <div className="w-[40%] flex flex-col items-end h-full relative ">
                    <P className="  text-[#1E1E1E] leading-[23px] text-[18px] font-kiona mt-[80px]">
                    Join a team that’s redefining fashion by blending thrift and luxury. Together, we’ll inspire confidence, promote sustainability, and shape the future of style. Let’s create something extraordinary—together
                    </P>

                    <div className="w-full mt-[89px] flex items-center justify-end gap-[12px]  " >
                    <div className="flex items-center justify-end gap-[12px] w-auto cursor-pointer  border-0 border-b-[1px] border-b-primary" >
                    <P className=" text-right text-primary text-sm font-normal uppercase" >Apply here</P>
                    <ArrowRight color="#68191E" size={16} />
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};

export default JoinTheTeam;
