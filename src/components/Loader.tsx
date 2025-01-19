'use client'
import React, { useState, useEffect } from 'react';

const Loader = () => {
  const [loading, setLoading] = useState(true);
  const [welcomeText, setWelcomeText] = useState('');
  const [brandText, setBrandText] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const welcomeFullText = "Welcome to";
  const brandFullText = "HIMSPIRED";
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [brandIndex, setBrandIndex] = useState(0);
  const [startBrandTyping, setStartBrandTyping] = useState(false);

  const splitBrandText = (text: string) => {
    const him = text.slice(0, 3); 
    const spired = text.slice(3); 
    return (
      <>
        <span className="text-[#68191E]">{him}</span>
        <span className="text-black font-kiona">{spired}</span>
      </>
    );
  };

  useEffect(() => {
    if (welcomeIndex < welcomeFullText.length) {
      const timer = setTimeout(() => {
        setWelcomeText((current) => current + welcomeFullText[welcomeIndex]);
        setWelcomeIndex((current) => current + 1);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      const hideWelcomeTimer = setTimeout(() => {
        setShowWelcome(false);
      }, 800);
      
      const startBrandTimer = setTimeout(() => {
        setStartBrandTyping(true);
      }, 1000);
      
      return () => {
        clearTimeout(hideWelcomeTimer);
        clearTimeout(startBrandTimer);
      };
    }
  }, [welcomeIndex]);

  useEffect(() => {
    if (startBrandTyping && brandIndex < brandFullText.length) {
      const timer = setTimeout(() => {
        setBrandText((current) => current + brandFullText[brandIndex]);
        setBrandIndex((current) => current + 1);
      }, 100);
      return () => clearTimeout(timer);
    } else if (startBrandTyping && brandIndex === brandFullText.length) {
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 1500);
      
      const removeTimer = setTimeout(() => {
        setLoading(false);
      }, 3000);
      
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [startBrandTyping, brandIndex]);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-all duration-1000 ease-in-out ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        transition: 'all 1.5s ease-in-out'
      }}
    >
      <div
        className={`text-center flex flex-col gap-4 transition-all duration-1000 ease-in-out ${
          fadeOut ? 'scale-125' : 'scale-100'
        }`}
        style={{
          transition: 'all 1.5s ease-in-out'
        }}
      >
        {showWelcome && (
          <h2 className="lg:text-[40px] text-[25px] font-kiona transition-all duration-500 ease-in-out opacity-100">
            {welcomeText}
            {welcomeIndex < welcomeFullText.length && <span className="animate-pulse">|</span>}
          </h2>
        )}
        <h2
          className={`lg:text-[120px] text-[65px]  font-moon transition-all duration-2000 ease-in-out transform ${
            fadeOut ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
          }`}
          style={{
            transition: 'all 1.5s ease-in-out'
          }}
        >
          {splitBrandText(brandText)}
          {startBrandTyping && brandIndex < brandFullText.length && <span className="animate-pulse">|</span>}
        </h2>
      </div>
    </div>
  );
};

export default Loader;