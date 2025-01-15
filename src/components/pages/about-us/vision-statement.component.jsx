import { H, P } from "@/components/common/typography";

const VisionStatement = () => {
    return (
        <div className="w-full mt-[120px]  px-[120px] relative" >
            <div className="w-full flex  items-start justify-between h-full relative">
                <div className="w-[50%] h-full" >
                    <h1 className=" text-[40px] font-moon font-bold">
                        Vision <span className=" text-grey">Statement</span>
                    </h1>
                </div>
                <div className="w-[50%] flex items-end h-full relative mt-[50px]">
                    <P className="  text-[#1E1E1E] leading-[23px] text-[18px] font-kiona">
                        At Himspire, established in 2025, we envision a world where fashion transcends boundaries, empowering individuals to express their unique identity while embracing sustainability and luxury. Our mission is to redefine style by curating a harmonious blend of handpicked thrifted treasures and exquisite luxury wear, offering our customers a diverse range of timeless, high-quality pieces.
                        We aim to inspire confidence, individuality, and creativity by making premium fashion accessible to everyone, bridging the gap between affordability and elegance. Driven by a commitment to sustainability, we champion the art of giving pre-loved fashion a new life, promoting conscious consumption while celebrating the sophistication of luxury design.
                        Himspire is more than a clothing brand; it is a movement that uplifts fashion enthusiasts to make bold, meaningful choices. With every piece we deliver, we aspire to redefine what it means to be stylish, responsible, and inspired, one outfit at a time.
                    </P>
                </div>
            </div>
        </div>
    );
};

export default VisionStatement;
