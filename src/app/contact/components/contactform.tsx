import React from 'react'
import Image from 'next/image'
import Enterbtn from '../../../../public/images/enterbtn.svg'

const contactform = () => {
  return (
    <div className='flex justify-between mt-[3em] mb-[7em] '>
        <div>
            <h1 className='font-[500] text-[40px]'>CONTACT US</h1>
        </div>
        <div className='flex flex-col gap-[3em]'>
            <h1 className='font-[400] 2xl:text-[25px]'>Have questions, feedback, or just want to say hi? We are here to help!</h1>
            <input type="text" className=' border-b-[1px] w-[80%] border-black py-4 focus:outline-none ' placeholder='ENTER NAME'/>
            <input type="text" className=' border-b-[1px] w-[80%] border-black py-4 focus:outline-none' placeholder='ENTER EMAIL ADDRESS'/>
            <div className='flex  gap-[1em]'>
            <textarea  className=' border-b-[1px] w-[80%] h-[7em] border-black P-5 focus:outline-none' placeholder='HOW CAN  WE HELP?'/>
            <Image src={Enterbtn} alt='enter button'/>

            </div>
            

        </div>
    </div>
  )
}

export default contactform