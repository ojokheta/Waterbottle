import React from "react";
import TestimonialsCard from "./TestimonialsCard";

const Testimonials = () => {
  return (
    <section className="pt-28">
      <div className="flex flex-col md:flex-row text-center md:text-start items-center gap-10 px-4">
        <h2 className="bg-yellow text-black text-3xl font-bold p-2 rounded-md">
          Testimonials
        </h2>
        <p className="max-w-lg">
          Hear from Our Satisfied Clients: Read Our Testimonials to Learn More
          about Our Digital Marketing Services
        </p>
      </div>
      <TestimonialsCard />
    </section>
  );
};

export default Testimonials;
