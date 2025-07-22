import React, { useState, useEffect } from 'react';
import breakfastImage from '../assets/breakfast.jpg';
import dinnerImage from '../assets/dinner.jpg';
import lunchImage from '../assets/lunch.jpg';
import beefMeat from '../assets/beefMeat.jpg';
import beer from '../assets/beer.jpg';
import chers from '../assets/chers.jpg';
import George from '../assets/George.jpg';
import jambo from '../assets/jambo.jpg';
import jamboBeer from '../assets/jamboBeer.jpg';
import kitfo from '../assets/kitfo.jpg';
import sheklaTibs from '../assets/sheklaTibs.jpg';

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [breakfastImage, dinnerImage, lunchImage, beefMeat, beer, chers, George, jambo, jamboBeer, kitfo, sheklaTibs];
  const [fade, setFade] = useState(true);

  // Function to go to the next image
  const nextImage = () => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      setFade(true);
    }, 200);
  };

  // Function to go to the previous image
  const prevImage = () => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
      setFade(true);
    }, 200);
  };

  // useEffect to automatically change images every 3 seconds
  useEffect(() => {
    const intervalId = setInterval(nextImage, 3000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="relative w-full max-w-2xl h-64 overflow-hidden p-4 m-4 rounded-2xl shadow-2xl bg-white bg-opacity-60 animate-fade-in-up">
      <img
        src={images[currentIndex]}
        alt={`Restaurant ${currentIndex + 1}`}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out rounded-xl shadow-lg ${fade ? 'opacity-100 scale-105' : 'opacity-0 scale-95'}`}
        style={{ objectFit: 'cover' }}
      />
      <button
        onClick={prevImage}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full shadow-lg text-xl font-bold hover:scale-110 hover:bg-blue-100 transition-all duration-200 animate-fade-in-left"
        aria-label="Previous"
      >
        &#8592;
      </button>
      <button
        onClick={nextImage}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full shadow-lg text-xl font-bold hover:scale-110 hover:bg-blue-100 transition-all duration-200 animate-fade-in-right"
        aria-label="Next"
      >
        &#8594;
      </button>
    </div>
  );
};

export default Carousel;
