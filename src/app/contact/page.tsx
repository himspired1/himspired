import React from 'react'
import Backbtn from '../../../public/images/backbtn.svg'
import Image from 'next/image'
import Contactform from './components/contactform'


const page = () => {
  return (
    <div className='lg:px-[5em] px-[2em] mt-[10em] '>

        <Contactform/> 
        
    </div>
  )
}

export default page