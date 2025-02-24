import React from 'react';

const HorizontalScrollPage: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden">
      {/* Horizontal Scroll Section */}
      <div className="w-[300vw] h-screen flex overflow-x-auto snap-x snap-mandatory">
        <div className="w-screen h-screen snap-start bg-orange-400 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white">Page 1</h1>
        </div>
        <div className="w-screen h-screen snap-start bg-green-400 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white">Page 2</h1>
        </div>
        <div className="w-screen h-screen snap-start bg-blue-400 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white">Page 3</h1>
        </div>
      </div>

      {/* Vertical Scroll Section */}
      <div className="w-screen h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Vertical Section</h1>
        <p className="text-lg mt-4">
          You have completed the horizontal scroll. Welcome to the vertical scroll section!
        </p>
      </div>
    </div>
  );
};

export default HorizontalScrollPage;
