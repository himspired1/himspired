"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Enterbtn from '../../../../public/images/enterbtn.svg';
import { toast } from 'sonner';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [lastSubmit, setLastSubmit] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name.trim()) {
      toast.error('Name required');
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email required');
      return false;
    }
    
    // Quick email check - good enough
    if (!formData.email.includes('@')) {
      toast.error('Invalid email');
      return false;
    }
    
    if (!formData.message.trim()) {
      toast.error('Message required');
      return false;
    }

    if (formData.message.length > 2000) {
      toast.error('Message too long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    // Check rate limit - one per day
    const now = Date.now();
    if (lastSubmit && (now - lastSubmit) < 24 * 60 * 60 * 1000) {
      const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (now - lastSubmit)) / (60 * 60 * 1000));
      toast.error(`Wait ${hoursLeft} more hours before sending another message`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Message sent! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
        setLastSubmit(now);
        localStorage.setItem('lastContactSubmit', now.toString());
      } else if (result.rateLimited) {
        toast.error('Rate limited. Try again in 24 hours.');
      } else {
        toast.error('Failed to send. Try again.');
      }
    } catch (error) {
      console.error('Contact error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user submitted recently
    const stored = localStorage.getItem('lastContactSubmit');
    if (stored) {
      setLastSubmit(parseInt(stored));
    }
  }, []);

  return (
    <div className='flex gap-[2em] flex-col lg:flex-row justify-between mt-[3em] mb-[7em]'>
      <div>
        <h1 className='font-[500] text-[40px] font-moon'>CONTACT US</h1>
      </div>
      
      <div className='flex flex-col gap-[3em]'>
        <h1 className='font-[400] 2xl:text-[20px] text-[18px] lg:text-wrap lg:w-[75%] font-activo'>
          HAVE QUESTIONS, FEEDBACK, OR OTHER COMPLAINTS? WE ARE HERE TO HELP!
        </h1>
        
        <form onSubmit={handleSubmit} className='flex flex-col gap-[3em]'>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            className='border-b border-black py-4 lg:w-[75%] focus:outline-none placeholder:uppercase uppercase' 
            placeholder='ENTER NAME'
            required
            disabled={loading}
          />
          
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            className='border-b border-black py-4 lg:w-[75%] focus:outline-none placeholder:uppercase uppercase' 
            placeholder='ENTER EMAIL ADDRESS'
            required
            disabled={loading}
          />
          
          <div className='flex gap-[1em]'>
            <textarea 
              name="message"
              value={formData.message}
              onChange={handleChange}
              className='border-b w-[80%] h-[7em] border-black p-5 focus:outline-none placeholder:uppercase uppercase' 
              placeholder='HOW CAN WE HELP?'
              required
              disabled={loading}
              maxLength={2000}
            />
            
            <button 
              type="submit" 
              disabled={loading}
              className='cursor-pointer flex items-end disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <div className="w-[5em] h-[5em] md:w-auto md:h-auto flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#68191E]"></div>
                </div>
              ) : (
                <Image src={Enterbtn} alt='send' className='w-[5em] md:w-auto' />
              )}
            </button>
          </div>
          
          {formData.message.length > 1800 && (
            <p className="text-xs text-gray-500 lg:w-[75%]">
              {formData.message.length}/2000 characters
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContactForm;