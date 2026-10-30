import React from "react";
import ContactForm from "./ContactForm";

const Contact = () => {
  return (
    <section className="pt-36 px-4">
      <div className="flex flex-col items-center text-center md:text-start md:flex-row gap-5 md:gap-10">
        <h2 className="bg-yellow text-black text-3xl font-bold p-2 rounded-md">
          Contact Us
        </h2>
        <p className="max-w-xs">
          Connect with Us: Let&apos;s Discuss Your Digital Marketing Needs
        </p>
      </div>
      <ContactForm />
    </section>
  );
};

export default Contact;
