"use client";
import { useRef, useState } from "react";

import { useB } from "@/context/BContext";
import { useA } from "@/context/AContext";
import { usePV } from "@/context/PVContext";
import { useChat } from "@/context/ChatContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserGroup,
  faBullhorn,
  faSortAlphaAsc,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import {
  ArrowLeft,
  ArrowRight,
  EllipsisVertical,
  Search,
  X,
} from "lucide-react";
const data = [
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved ",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-red-600 via-red-50 to-red-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
];
export default function NewGroup_T_A({ setActiveA, language, theme, isDark }) {
  const { selectedData, setSelectedData } = useChat();
  const contactsRef = useRef([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { setActiveB } = useB();
  // const { setActiveA } = useA();
  const { setActivePV } = usePV();
  const [isScrolled2, setIsScrolled2] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <>
      <div
        onScroll={(e) => {
          setIsScrolled2(e.currentTarget.scrollTop > 10);
        }}
        className={`overflow-y-scroll
                scrollbar-none pb-[90px] `}
      >
        {/* Header2 */}
        <div
          className={`
                  relative
                  w-full
                  overflow-hidden
                  z-30
                  
                  
                  transition-[height]
                  duration-300
                  ease-out
   
                  
                      h-[130px] ${
                        theme == "red" && isDark == true
                          ? "bg-[#310a0a]"
                          : theme == "blue" && isDark == true && "bg-[#212641]"
                      } rounded-b-[0px]
                `}
        >
          {/* Header Top */}
          <div
            className={`${
              isScrolled2 ? "bg-[#31364d]" : ""
            } fixed z-[60] w-full flex ${
              language == "english" ? "flex-row" : "flex-row-reverse"
            } items-center justify-between px-4 pt-3 pb-3`}
          >
            <div
              className={`flex ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              } items-center gap-[30px]`}
            >
              {language == "english" ? (
                <span
                  onClick={() => setActiveA(null)}
                  className="text-white font-semibold "
                >
                  <X size={22.5} />
                </span>
              ) : (
                <span
                  onClick={() => setActiveA(null)}
                  className="text-white font-semibold "
                >
                  <X size={22.5} />
                </span>
              )}
              <div className="flex items-center justify-start text-start flex-col">
                {language == "english" ? (
                  <h1 className="align-middle text-[19px] font-semibold text-white tracking-tight">
                    New Group
                  </h1>
                ) : (
                  <h1 className="align-middle text-[19px] font-semibold text-white tracking-tight">
                    گروه جدید
                  </h1>
                )}
              </div>
            </div>

            <span
              className={`text-white/70 p-1 flex ${
                language == "english" ? "flex-row-reverse" : ""
              } gap-[25px] items-center transition-all duration-300 ${
                search.length == 0
                  ? "scale-100 opacity-100"
                  : "scale-75 opacity-0"
              }`}
            >
              <span
                onClick={() => setSorted(true)}
                className={`cursor-pointer ${sorted ? "hidden" : ""}`}
              >
                {/* <EllipsisVertical size={20} /> */}
                <FontAwesomeIcon icon={faSortAlphaAsc} />
              </span>
              <span
                onClick={() => setSorted(false)}
                className={`cursor-pointer ${sorted ? "" : "hidden"}`}
              >
                {/* <EllipsisVertical size={20} /> */}
                <FontAwesomeIcon icon={faClock} />
              </span>
              <span
                className={`cursor-pointer mb-[2.5px] ${
                  !isScrolled2 ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              >
                <Search size={20} />
              </span>
            </span>
          </div>

          {language == "english" ? (
            <span className="z-[999] absolute top-[40px] left-[68.5px] text-gray-500 text-[17px] font-medium">
              up to 200000 members
            </span>
          ) : (
            <span className="z-[999] absolute top-[40px] right-[68.5px] text-gray-500 text-[17px] font-medium">
              تا ۲۰۰۰۰۰ کاربر
            </span>
          )}

          {/* Search */}
          <div
            className={`
                    absolute
                    bottom-[10px]
                    left-0
                    w-full
                    z-[50]
                    px-[10px]
                    flex
                    flex-col
                    gap-[10px]
                    overflow-hidden
                    transition-all
                    duration-300
                    ease-out
                  
                       max-h-[80px]
                    
                  `}
          >
            <div className="px-[15px] w-full h-[40px] rounded-full outline-none bg-white/10 flex items-center gap-[15px] relative">
              <span className="text-gray-400 text-center">
                <Search size={20} />
              </span>

              <input
                className="outline-none w-full text-white placeholder:text-gray-400 placeholder:font-normal placeholder:text-[16px]"
                placeholder="Who would you like to add?"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <span
                onClick={() => setSearch("")}
                className={`text-gray-400 text-center transition-all duration-300 ${
                  search.length == 0
                    ? "opacity-0 scale-75"
                    : "opacity-100 scale-100"
                }`}
              >
                <X size={20} />
              </span>
            </div>
          </div>
        </div>

        <div
          className={`z-20 transition-all duration-200  pt-[15px] ${
            search.length == 0
              ? "opacity-0 scale-75 hidden"
              : "opacity-100 scale-100"
          }`}
        >
          <div className="flex flex-col items-start w-full ">
            {data
              .filter((item) =>
                item.title.toLowerCase().includes(search.toLocaleLowerCase())
              )
              .map((item, index) => (
                <div
                  ref={contactsRef}
                  onClick={() => {
                    setSelectedConversation(index);
                    // setActiveB("chat");
                    //setActiveA(null);
                    setActivePV("preview");
                    setSelectedData({
                      title: item.title,
                      category: item.category,
                      colorClasses: item.colorClasses,
                      mobile: item.mobile,
                    });
                  }}
                  key={index}
                  className={`transition-all duration-300 active:bg-white/20 hover:bg-white/20 py-[10px] pl-[20px] flex min-w-full gap-[10px] items-center ${
                    selectedConversation === index ? "bg-white/[0.08]" : ""
                  }`}
                >
                  <div
                    className={`bg-conic-180 w-[42.5px] h-[42.5px] rounded-full ${item.colorClasses}`}
                  />
                  <div className="flex flex-col leading-[18px]">
                    <span className="text-white text-[15px]">{item.title}</span>
                    <span className="text-gray-500 text-[14px]">
                      last seen yesterday at 17:31
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <div
            className="flex items-center justify-center  mt-[15px]"
            dir="rtl"
          >
            {data.filter((item) =>
              item.title.toLowerCase().includes(search.toLocaleLowerCase())
            ).length == 0 && (
              <span className=" text-gray-500 font-medium text-[17px]">
                مخاطبی با این نام یافت نشد.
              </span>
            )}
          </div>
        </div>

        <div
          className={`z-10 transition-all duration-200 ${
            search.length == 0 ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          <div
            className={`${
              theme == "red" && isDark == true
                ? "bg-[#252525]"
                : theme == "blue" && isDark == true && "bg-[#282c3f]"
            } max-w-full rounded-2xl h-auto  pt-[12px] pb-[10px] flex flex-col gap-[15px] ${
              language == "english" ? "items-start" : "items-end"
            } mt-[15px] mx-[15px] box-border`}
          >
            {language == "english" ? (
              <span className="text-blue-300 font-semibold text-[15px] ml-[20px]">
                Sorted by last seen time
              </span>
            ) : (
              <span className="text-white/75 font-semibold text-[15px] mr-[20px]">
                مرتب شده بر اساس آخرین بازدید
              </span>
            )}
            <div className="flex flex-col items-start w-full ">
              {data.map((item, index) => (
                <div
                  ref={contactsRef}
                  onClick={() => {
                    setSelectedConversation(index);
                    // setActiveB("chat");
                    //setActiveA(null);
                    setActivePV("preview");
                    setSelectedData({
                      title: item.title,
                      category: item.category,
                      colorClasses: item.colorClasses,
                      mobile: item.mobile,
                    });
                  }}
                  key={index}
                  className={`transition-all duration-300 active:bg-white/20 hover:bg-white/20 py-[10px]  flex ${
                    language == "english"
                      ? "flex-row pl-[20px]"
                      : "flex-row-reverse pr-[20px]"
                  } min-w-full gap-[10px] items-center ${
                    selectedConversation === index ? "bg-white/[0.08]" : ""
                  }`}
                >
                  <div
                    className={`bg-conic-180 w-[42.5px] h-[42.5px] rounded-full ${item.colorClasses}`}
                  />
                  <div className="flex flex-col leading-[18px]">
                    <span
                      className={`text-white text-[15px] ${
                        language == "english" ? "text-left" : "text-right"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-gray-500 text-[14px]">
                      آخرین بازدید در ۱۷:۳۱
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
