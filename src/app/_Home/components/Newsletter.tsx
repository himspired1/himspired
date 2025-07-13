"use client";
import Wrapper from "@/components/layout/Wrapper";
import { ArrowUpRight } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success message from server or default
        toast.success(data.message || "Welcome to the Himspired Community!");
        setEmail(""); // Clear the input
      } else {
        // Handle different error cases
        if (response.status === 400 && data.error?.includes('already subscribed')) {
          toast.error("This email is already subscribed to our newsletter.");
        } else {
          toast.error(data.error || "Failed to subscribe. Please try again.");
        }
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Wrapper className="flex flex-col md:flex-row gap-y-4 py-40 uppercase md:gap-y-8 ">
      <h1 className=" text-4xl text-gray-850 flex-1 font-moon">
        Subscribe to our <br /> newsletter
      </h1>
      <div className="flex-1 md:mt-28 max-w-xl space-y-8">
        <p className="">
          Be the First to Know About Exclusive Deals, New Arrivals, and Style
          Inspiration Delivered Straight to Your Inbox.
        </p>
        <form
          onSubmit={handleSubmit}
          className="w-full flex items-end space-x-4 "
        >
          {" "}
          <input
            type="text"
            id="email"
            name="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="placeholder:uppercase outline-none border-b-[1px] border-gray-850 flex-1 py-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          />
          <button 
            type="submit" 
            className="p-10 bg-white-200 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-850"></div>
            ) : (
              <ArrowUpRight />
            )}
          </button>
        </form>
      </div>
    </Wrapper>
  );
};

export default Newsletter;