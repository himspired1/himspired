import Empowering from "@/components/pages/about-us/empower.component";
import aboutUsImage from "../../../public/images/about-us.svg"
import Image from "next/image";
import  VisionStatement from "@/components/pages/about-us/vision-statement.component"
import TheTeam from "@/components/pages/about-us/the-team.component"
import JoinTheTeam from "@/components/pages/about-us/join-team.component";
const AboutUs = () => {
    return (
        <>
            <div className="w-full  min-h-screen mt-[13em] pb-[120.93px]" >
                <Empowering />

                <div className="w-full mt-[80px]" >
                    <Image src={aboutUsImage} className="w-full object-contain" alt="about-us" />
                </div> 

                <VisionStatement/>

                <TheTeam/>
                <JoinTheTeam/>
            </div>
        </>
    );
}

export default AboutUs;