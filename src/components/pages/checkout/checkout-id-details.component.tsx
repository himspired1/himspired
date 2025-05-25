import { P } from "@/components/common/typography";

const CheckoutIDDetails = () => {
    return (
        <>
            <div className="w-full py-4 " >
                <div className="w-full" >
                    <P fontFamily="activo" className=" text-sm text-left font-semibold lg:text-base uppercase">INPUT YOUR DETAILS FOR IDENTIFIcation</P>
                </div>

                <div className=" w-full mt-8 " >
                    <input type="text" className=' border-b-[1px]  border-black py-4 w-full  focus:outline-none placeholder:uppercase placeholder:text-sm ' placeholder='ENTER NAME' />
                    <input type="email" className=' border-b-[1px]  border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase  placeholder:text-sm  ' placeholder='Enter email address' />
                    <input type="tel" className=' border-b-[1px]  border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase  placeholder:text-sm ' placeholder='Enter Phone number' />
                    <input type="text" className=' border-b-[1px]  border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase  placeholder:text-sm ' placeholder='Enter Mailing address' />
                    <textarea className=' border-b-[1px]  border-black py-4 w-full mt-10 focus:outline-none placeholder:uppercase  placeholder:text-sm ' placeholder='message' />
                </div>
            </div>
        </>
    );
}

export default CheckoutIDDetails;