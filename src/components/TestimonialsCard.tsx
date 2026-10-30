"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
  Mousewheel,
  Keyboard,
  FreeMode,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import "swiper/css/pagination";

const testimonials = [
  {
    text: "We have been working with $COOKED for the past year and have seen a significant increase in website traffic and leads as a result of their efforts. The team is professional, responsive, and truly cares about the success of our business. We highly recommend $COOKED to any company looking to grow their online presence.",
    author: "John Smith",
    role: "Marketing Director at XYZ Corp",
  },

  {
    text: "We have been working with $COOKED for the past year and have seen a significant increase in website traffic and leads as a result of their efforts. The team is professional, responsive, and truly cares about the success of our business. We highly recommend $COOKED to any company looking to grow their online presence.",
    author: "John Smith",
    role: "Marketing Director at XYZ Corp",
  },
  {
    text: "We have been working with $COOKED for the past year and have seen a significant increase in website traffic and leads as a result of their efforts. The team is professional, responsive, and truly cares about the success of our business. We highly recommend $COOKED to any company looking to grow their online presence.",
    author: "John Smith",
    role: "Marketing Director at XYZ Corp",
  },
  {
    text: "We have been working with $COOKED for the past year and have seen a significant increase in website traffic and leads as a result of their efforts. The team is professional, responsive, and truly cares about the success of our business. We highly recommend $COOKED to any company looking to grow their online presence.",
    author: "John Smith",
    role: "Marketing Director at XYZ Corp",
  },
  {
    text: "We have been working with $COOKED for the past year and have seen a significant increase in website traffic and leads as a result of their efforts. The team is professional, responsive, and truly cares about the success of our business. We highly recommend $COOKED to any company looking to grow their online presence.",
    author: "John Smith",
    role: "Marketing Director at XYZ Corp",
  },
];

const TestimonialsCard = () => {
  return (
    <div className="mt-16 rounded-[45px] bg-dark mx-4 py-10 lg:py-[60px]">
      <Swiper
        modules={[
          Navigation,
          Pagination,
          Autoplay,
          Mousewheel,
          Keyboard,
          FreeMode,
        ]}
        spaceBetween={30}
        slidesPerView={"auto"}
        freeMode={true}
        centeredSlides={true}
        pagination={{ clickable: true }}
        autoplay={{ delay: 7000 }}
        loop
        className="text-yellow max-w-full w-full"
      >
        {testimonials.map((testimonial, index) => (
          <SwiperSlide key={index}>
            <div className="relative px-6 lg:py-12 text-white">
              <p className="relative mb-8 leading-relaxed border-yellow border px-6 py-8 lg:p-16 rounded-[45px]">
                {testimonial.text}
                <span className="absolute -bottom-7 left-20 lg:left-28 transform -translate-x-1/2 w-0 h-0 border-t-[30px] border-t-dark border-x-[30px] border-x-transparent z-10"></span>
                <span className="absolute -bottom-8 left-20 lg:left-28 transform -translate-x-1/2 w-0 h-0 border-t-[32px] border-t-yellow border-x-[30px] border-x-transparent"></span>
              </p>
              <h4 className="font-semibold text-yellow ml-16 lg:ml-28 mt-10">
                {testimonial.author}
              </h4>
              <p className="text-gray/70 text-sm mt-1 ml-16 lg:ml-28 mb-16">
                {testimonial.role}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default TestimonialsCard;
