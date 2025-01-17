import React from 'react'
import ContactForm from './components/contactform'
import Backbtn from '../../../public/images/backbtn.svg'
import Enterbtn from '../../../public/images/enterbtn.svg'
import Image from 'next/image'
import Contactform from './components/contactform'
import Link from 'next/link'

const page = () => {
  return (
    <div className='lg:px-[5em] px-[2em] mt-[3em] '>
        {/* Header with back btn */}
        <Link href='/'>
        <div className='flex gap-5 '>
            <Image src={Backbtn} alt='Back Button' className=''/>
            <h1>BACK</h1>
        </div>
        </Link>

        <Contactform/> 
        
    </div>
  )
}

export default page