import {H, P} from "../../common/typography/index"
import team1 from "../../../../public/images/team-1.svg"
import team2 from "../../../../public/images/team-2.svg"
import team3 from "../../../../public/images/team-3.svg"
import team4 from "../../../../public/images/team-4.svg"
import team5 from "../../../../public/images/team-5.svg"
import team6 from "../../../../public/images/team-6.svg"
// import team7 from "../../../../public/images/team-7.svg"
// import team8 from "../../../../public/images/team-8.svg"
import Image from "next/image"
// import { ArrowRight } from "lucide-react"

const TheTeam = () => {
  const teams = [
    {name:"Ejere David", image:team1, role:"Founder & Web Developer"},
    {name:"Precious Chidera", image:team2, role:"Manager"},
    {name:"Igharosa efosa", image:team3, role:"Product Designer"},
    {name:"Tobe Emeka-Opah", image:team4, role:"Video Editor"},
    {name:"Precious Gift", image:team5, role:"Content creator"},
    {name:"darla stephens", image:team6, role:"Brand Strategist"}
  ]

  return (
    <>
      <div className="w-full bg-[#F4F4F4] items-center mt-[74px] lg:px-[120px] py-[80px]">
        <div className="w-full px-[2em] lg:px-0">
          <H fontFamily="moon" className="font-normal text-4xl">
            Meet the <span className="text-primary">himspired</span> team
          </H>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mt-[100px] px-4 lg:px-0">
          {teams.map(({name, role, image}, index) => (
            <div key={index} className="cursor-pointer mb-[60px]">
              <Image src={image} alt={name} className="object-cover w-full" />
              <P className="text-[20px] uppercase mt-[16px]">{name}</P>
              <P className="text-[10px] mt-[8px] uppercase">{role}</P>
            </div>
          ))}
        </div>
        {/* 
        <div className="w-full mt-[100px] flex items-center justify-end gap-[12px]">
          <div className="flex cursor-pointer items-center justify-end gap-[12px] w-auto border-0 border-b-[1px] border-b-primary">
            <P className="text-right text-primary text-sm font-normal uppercase">View More</P>
            <ArrowRight color="#68191E" size={16} />
          </div>
        </div> 
        */}
      </div>
    </>
  );
}

export default TheTeam;