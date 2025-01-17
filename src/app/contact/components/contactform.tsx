import React from 'react'
import Image from 'next/image'
import Enterbtn from '../../../../public/images/enterbtn.svg'

const contactform = () => {
  return (
    <div className='flex gap-[2em] flex-col lg:flex-row justify-between mt-[3em] mb-[7em] '>
        <div>
            <h1 className='font-[500] text-[40px] font-moon'>CONTACT US</h1>
        </div>
        <div className='flex flex-col gap-[3em]'>
            <h1 className='font-[400] 2xl:text-[20px] text-[18px] lg:text-wrap lg:w-[75%] font-activo'>HAVE QUESTIONS, FEEDBACK, OR OTHER COMPLAINTS? WE ARE HERE TO HELP!</h1>
            <input type="text" className=' border-b-[1px]  border-black py-4 lg:w-[75%] focus:outline-none ' placeholder='ENTER NAME'/>
            <input type="text" className=' border-b-[1px]  border-black py-4 lg:w-[75%] focus:outline-none' placeholder='ENTER EMAIL ADDRESS'/>
            <div className='flex  gap-[1em]'>
            <textarea  className=' border-b-[1px] w-[80%] h-[7em] border-black P-5 focus:outline-none' placeholder='HOW CAN  WE HELP?'/>
            <div className='cursor-pointer flex items-end'>
            <Image src={Enterbtn} alt='enter button' className='w-[5em] md:w-auto' />
            </div>


            </div>
            

        </div>
    </div>
  )
}

export default contactform