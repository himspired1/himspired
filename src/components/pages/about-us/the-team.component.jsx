import {H, P} from "../../common/typography/index"
import team1 from "../../../../public/images/team-1.svg"
import team2 from "../../../../public/images/team-2.svg"
import team3 from "../../../../public/images/team-3.svg"
import team4 from "../../../../public/images/team-4.svg"
import team5 from "../../../../public/images/team-5.svg"
import team6 from "../../../../public/images/team-6.svg"
import team7 from "../../../../public/images/team-7.svg"
import team8 from "../../../../public/images/team-8.svg"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
const TheTeam = () => {
    const teams = [
        {
            name:"Ejere David",
            image:team1,
            role:"Founder & Web Developer"
        },
        {
            name:"Aiko in-yo",
            image:team2,
            role:"Fashion designer"
        },
        {
            name:"Igharosa efosa",
            image:team3,
            role:"Product Designer"
        },
        {
            name:"gwen gaye",
            image:team4,
            role:"Marketing Strategist"
        },
        {
            name:"Ejere David",
            image:team5,
            role:"Founder & Web Developer"
        },
        {
            name:"darla stephens",
            image:team6,
            role:"Brand Strategist"
        },
        {
            name:"mcarthy jones",
            image:team7,
            role:"Head of sales"
        },
        {
            name:"sam smith",
            image:team8,
            role:"Product manager"
        },
    ]
    return ( 
        <>
    <div className="w-full bg-[#F4F4F4]  mt-[74px] px-[120px] py-[80px]" >
                <div className="w-full" >
                    <H fontFamily="moon" className="font-normal text-4xl" >Meet the <span className=" text-primary" >himspired</span> team</H>
                </div>

                <div className="w-full flex gap-[5px] flex-wrap items-center justify-between mt-[100px]" >
                    {teams.map(({name,role,image},index)=>(
                        <div key={index} className="w-[264px] cursor-pointer  mb-[60px]" >
                            <Image src={image} alt="teams" className=" object-cover w-full"  />
                            <P className=" text-[20px] uppercase mt-[16px]" >{name}</P>
                            <P className="text-[10px] mt-[8px] uppercase" >{role}</P>
                     </div>
                    ))}
                </div>

                <div className="w-full mt-[100px] flex items-center justify-end gap-[12px]  " >
                    <div className="flex cursor-pointer items-center justify-end gap-[12px] w-auto  border-0 border-b-[1px] border-b-primary" >
                    <P className=" text-right text-primary text-sm font-normal uppercase" >View More</P>
                    <ArrowRight color="#68191E" size={16} />
                    </div>
                </div>
        </div>
        </>
     );
}
 
export default TheTeam;