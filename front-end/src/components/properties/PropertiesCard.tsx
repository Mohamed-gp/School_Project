import { FaHeart, FaStar } from "react-icons/fa6";
// this for static data
// import { propertiesCardsData } from "../../utils/data";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import customAxios from "../../utils/axios";
import Properties from "../../pages/properties/Properties";
import {propertiesCardsData} from "../../utils/data.ts"



interface PropertiesCardProps {
  all : boolean
}


const PropertiesCard = ({all}: PropertiesCardProps) => {

  // const fetchData = async () => {
  //   try {
  //     const {data} = await customAxios.get("/homes")

  //     setpropertiesCardsData(propertiesCardsData)
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  // useEffect(() => {
  //   // fetchData()
  // },[])
  // useEffect(() => {
  //   console.log(propertiesCardsData)
  // },[propertiesCardsData])
  let propertiesUsed = all ? propertiesCardsData : propertiesCardsData.slice(1,5)
  
  
  return (
    <>
    {propertiesUsed.map((property : any) => {
      return (
        <Link to="/properties/12" key={property.path} className="w-[240px] rounded-xl overflow-hidden">
          <div className="img">
            <img
              src={property.path}
              alt={property.title}
            />
          </div>
          <div className="flex flex-col gap-2 px-3 py-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold">{property.title}</p>
                <p>$120.00/ Night</p>
              </div>
              <FaHeart />
            </div>
            <div className="flex gap-1">
              <span className="flex text-yellow-400">
                <FaStar />
              </span>
              <span className="flex text-yellow-400">
                <FaStar />
              </span>
              <span className="flex text-yellow-400">
                <FaStar />
              </span>
              <span className="flex text-yellow-400">
                <FaStar />
              </span>
              <span>
                <FaStar />
              </span>
            </div>
          </div>
        </Link>
      );
    })}
    </>
  )
}
export default PropertiesCard