const Empowering = () => {
  return (
    <div className="w-full lg:px-[120px] relative lg:h-[215px] mt-[3em]">
      <div className="w-full flex flex-col lg:flex-row  items-center justify-between h-full relative px-[2em]">
        <div className="lg:w-[60%] h-full">
          <h1 className=" text-[40px] font-moon font-bold">
            Empowering Style,
            <span className=" text-gray-500">
              {" "}
              Inspiring <br className="hidden lg:block" />
              Confidence
            </span>
          </h1>
        </div>
        <div className="lg:w-[40%] flex items-end h-full relative mt-[">
          <p className="  text-[#1E1E1E] leading-[25px] mt-[1em]  text-[18px] font-kiona font-medium">
            At <span className="text-[#68191E]">Himspired</span>, we handpick
            premium thrifted pieces that blend timeless vintage charm with
            modern elegance. Each item is carefully selected for its quality and
            luxury, ensuring that every piece elevates your style. This is more
            than secondhand, it`s pre-loved fashion that empowers you to look and
            feel your best, all while staying within your budget. We believe
            that luxury shouldn`t come with a hefty price tag, and that every
            item tells a unique story of individuality, sophistication, and
            style.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Empowering;
