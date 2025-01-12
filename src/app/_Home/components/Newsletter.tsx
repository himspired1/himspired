"use client";
import { ArrowUpRight } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      toast.error("Please enter a valid email address.");
    } else {
      toast.success("Email submitted successfully!");
      setEmail("");
    }
  };
  return (
    <div className="flex px-30 py-40 uppercase space-x-60 ">
      <h1 className=" text-4xl text-gray-850 flex-1">
        Subscribe to our newsletter
      </h1>
      <div className="flex-1">
        <p className="">
          Be the First to Know About Exclusive Deals, New Arrivals, and Style
          Inspiration Delivered Straight to Your Inbox.
        </p>
        <form
          onSubmit={handleSubmit}
          className="w-full flex items-end space-x-4"
        >
          {" "}
          <input
            type="text"
            id="email"
            name="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="placeholder:uppercase outline-none border-b-[1px] border-gray-850 flex-1 py-2"
          />
          <button type="submit" className="p-10 bg-white-200 rounded-full">
            <ArrowUpRight />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Newsletter;
