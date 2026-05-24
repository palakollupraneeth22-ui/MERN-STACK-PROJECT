import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import API from "../services/api";
import { useTheme } from "../useTheme";
import { toast } from "react-hot-toast";
import "./DashBoard.css";

const AVAILABLE_COURSES = [
  { 
    id: 1, 
    title: "The Complete 2024 Web Development Bootcamp", 
    platform: "Udemy", 
    totalHours: 65, 
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Section 1: Frontend Basics",
        lessons: [
          { title: "Intro to HTML", duration: 5, videoUrl: "https://youtu.be/2ALggxhY2zw?si=v7dyGcp6-fqn8lg1" },
          { title: "Intro to CSS", duration: 8, videoUrl: "https://youtu.be/1PnVor36_40?si=Nggr3NGWvfwSeRtA" },
          { title: "Intro to Flexbox", duration: 6, videoUrl: "https://youtu.be/13WQDIM7evQ?si=Z3-2tlGvmRefb_QY" }
        ]
      },
      {
        title: "Section 2: JavaScript Fundamentals",
        lessons: [
          { title: "Variables & Data Types", duration: 12, videoUrl: "https://youtu.be/Gb0__pQnbmI?si=DSv4sWdhfxMQIH_Z" },
          { title: "Functions", duration: 15, videoUrl: "https://youtu.be/FOD408a0EzU?si=tTJ3UNAkVDylTT7T" },
          { title: "loops", duration: 15,  videoUrl:"https://youtu.be/s9wW2PpJsmQ?si=40rrv7uys0y-5pm6" }
        ]
      }
    ]
  },
  { 
    id: 2, 
    title: "Machine Learning A-Z: AI, Python & R", 
    platform: "Udemy", 
    totalHours: 44, 
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Part 1: Data Preprocessing",
        lessons: [
          { title: "Importing the Libraries", duration: 5, videoUrl: "https://youtu.be/_YllXd1pukg?si=U1_z_PBVdu63u_FL" },
          { title: "Importing the Dataset", duration: 10, videoUrl: "https://youtu.be/Wi_ovkzhTmc?si=1rRn10j9xrnm1bzW" },
          { title: "Handling Missing Data", duration: 15, videoUrl: "https://youtu.be/yFJ2_phRslY?si=XsaT4BbVupOG-o0j" }
        ]
      },
      {
        title: "Part 2: Regression",
        lessons: [
          { title: "Simple Linear Regression", duration: 20, videoUrl: "https://youtu.be/QcPycBZomac?si=QOTm74KkDOUklIjg" },
          { title: "Multiple Linear Regression", duration: 25, videoUrl: "https://youtu.be/_OyKjstWe80?si=8i8nO95__V2M5g0i" }
        ]
      }
    ]
  },
  { 
    id: 3, 
    title: "Meta Front-End Developer Professional Certificate", 
    platform: "Coursera", 
    totalHours: 120, 
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Course 1: Introduction to Front-End Development",
        lessons: [
          { title: "Web and Web 2.0", duration: 15, videoUrl: "https://youtu.be/WG5ikvJ2TKA?si=cOouHaozzUVefZRH" },
          { title: "Core Internet Technologies", duration: 20, videoUrl: "https://youtu.be/salY_Sm6mv4?si=lC6DWcCm0VCrb2PK" }
        ]
      },
      {
        title: "Course 2: Programming with JavaScript",
        lessons: [
          { title: "Introduction to JavaScript", duration: 30, videoUrl: "https://youtu.be/W6NZfCO5SIk?si=7RRLjFAa4cuAHs30" },
          { title: "Building Blocks of a Program", duration: 45, videoUrl: "https://youtu.be/7plr3cXjtAw?si=M6CG7r1nN_mupBF9" }
        ]
      }
    ]
  },
  { 
    id: 4, 
    title: "CS50's Introduction to Computer Science", 
    platform: "edX", 
    totalHours: 144, 
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Week 0: Scratch",
        lessons: [
          { title: "Computational Thinking", duration: 10, videoUrl: "https://youtu.be/qbnTZCj0ugI?si=CRHTm3G98dJ9qKW8" },
          { title: "Scratch Basics", duration: 15, videoUrl: "https://youtu.be/h6lqxDwUmJQ?si=BcsjUe_R80EOqRTh" }
        ]
      },
      {
        title: "Week 1: C",
        lessons: [
          { title: "Hello World in C", duration: 12, videoUrl: "https://youtu.be/fmyRqhaqFXA?si=N4vDnm2gAQUHFFaf" },
          { title: "Data Types & Variables", duration: 18, videoUrl: "https://youtu.be/ZRvcYkz9m70?si=UZZyRS6bZZu01tl_" }
        ]
      }
    ]
  },
  { 
    id: 5, 
    title: "Google Data Analytics Professional Certificate", 
    platform: "Coursera", 
    totalHours: 180, 
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Course 1: Data, Data, Everywhere",
        lessons: [
          { title: "Intro to Data Analytics", duration: 8, videoUrl: "https://youtu.be/yZvFH7B6gKI?si=lfu2GJjMyxZBKmQY" },
          { title: "Data Ecosystems", duration: 12, videoUrl: "https://youtu.be/bqneLnnmTTk?si=4JF6_y2oxNyE2xp9" }
        ]
      },
      {
        title: "Course 2: Ask Questions to Make Decisions",
        lessons: [
          { title: "Effective Questioning", duration: 10, videoUrl: "https://youtu.be/kWZEXXd2tZA?si=qILBp5SQtzz1Gby4" },
          { title: "Data-Driven Decisions", duration: 15, videoUrl: "https://youtu.be/EV3T1RYWC9g?si=jyWkABf46zBwLAcf" }
        ]
      }
    ]
  },
  { 
    id: 6, 
    title: "React - The Complete Guide 2024 (incl. React Router & Redux)", 
    platform: "Udemy", 
    totalHours: 50, 
    image: "https://tse1.mm.bing.net/th/id/OIP.HLm2E6f2lJSwgUDifODtPQHaEK?w=700&h=393&rs=1&pid=ImgDetMain&o=7&rm=3",
    modules: [
      {
        title: "Section 1: Getting Started",
        lessons: [
          { title: "What is React?", duration: 5, videoUrl: "https://youtu.be/s2skans2dP4?si=FQGXdlo0ed9lpCkR" },
          { title: "Creating a React App", duration: 10, videoUrl: "https://youtu.be/2OTq15A5s0Y?si=5i1BDOyVlh6X29Sq" }
        ]
      },
      {
        title: "Section 2: React Basics & Components",
        lessons: [
          { title: "Building Custom Components", duration: 12, videoUrl: "https://youtu.be/d5ooYpXioqE?si=2SdyDwPwuX6e7vEi" },
          { title: "Passing Data via Props", duration: 15, videoUrl: "https://youtu.be/uvEAvxWvwOs?si=uFxw-RBjCOiBb8ZU" }
        ]
      }
    ]
  },
  { 
    id: 7, 
    title: "100 Days of Code: The Complete Python Pro Bootcamp", 
    platform: "Udemy", 
    totalHours: 60, 
    image :"https://tse4.mm.bing.net/th/id/OIP.d7tt2avbWH2oZEDyUPkn0gHaFa?rs=1&pid=ImgDetMain&o=7&rm=3",
    modules: [
      {
        title: "Day 1: Working with Variables",
        lessons: [
          { title: "Printing to Console", duration: 5, videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc" },
          { title: "String Manipulation", duration: 8, videoUrl: "https://www.youtube.com/watch?v=k9TUPpGqYTo" }
        ]
      },
      {
        title: "Day 2: Data Types",
        lessons: [
          { title: "Primitive Data Types", duration: 10, videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw" },
          { title: "Mathematical Operations", duration: 12, videoUrl: "https://www.youtube.com/watch?v=YYXdXT2l-Gg" }
        ]
      }
    ]
  },
  { 
    id: 8, 
    title: "iOS & Swift - The Complete iOS App Development Bootcamp", 
    platform: "Udemy", 
    totalHours: 60, 
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Section 1: Getting Started with iOS",
        lessons: [
          { title: "Xcode Setup", duration: 10, videoUrl: "https://www.youtube.com/watch?v=comQ1-x2a1Q" },
          { title: "First iOS App", duration: 15, videoUrl: "https://www.youtube.com/watch?v=8Xg7E9shq0U" }
        ]
      },
      {
        title: "Section 2: Swift Programming Basics",
        lessons: [
          { title: "Swift Variables", duration: 12, videoUrl: "https://www.youtube.com/watch?v=Ulp1Kimblg0" },
          { title: "Control Flow", duration: 18, videoUrl: "https://www.youtube.com/watch?v=qV9RvvnZsWQ" }
        ]
      }
    ]
  },
  { 
    id: 9, 
    title: "Deep Learning Specialization", 
    platform: "Coursera", 
    totalHours: 100, 
    image: "https://images.unsplash.com/photo-1527474305487-b87b222841cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Course 1: Neural Networks and Deep Learning",
        lessons: [
          { title: "Intro to Deep Learning", duration: 10, videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk" },
          { title: "Neural Network Basics", duration: 15, videoUrl: "https://www.youtube.com/watch?v=bfmFfD2RIcg" }
        ]
      },
      {
        title: "Course 2: Improving Deep Neural Networks",
        lessons: [
          { title: "Hyperparameter Tuning", duration: 12, videoUrl: "https://www.youtube.com/watch?v=1WAzjhoAQB8" },
          { title: "Regularization", duration: 18, videoUrl: "https://www.youtube.com/watch?v=KptO-J1-k1A" }
        ]
      }
    ]
  },
  { 
    id: 10, 
    title: "Mastering Data Structures & Algorithms using C and C++", 
    platform: "Udemy", 
    totalHours: 58, 
    image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Section 1: Essential Concepts",
        lessons: [
          { title: "Pointers in C/C++", duration: 10, videoUrl: "https://www.youtube.com/watch?v=zuegQmMdy8M" },
          { title: "Structures and Functions", duration: 12, videoUrl: "https://www.youtube.com/watch?v=3lZ_ZgOOtuU" }
        ]
      },
      {
        title: "Section 2: Recursion",
        lessons: [
          { title: "How Recursion Works", duration: 15, videoUrl: "https://www.youtube.com/watch?v=ngCos392W4w" },
          { title: "Types of Recursion", duration: 18, videoUrl: "https://www.youtube.com/watch?v=k7-N8R0-KY4" }
        ]
      }
    ]
  },
  { 
    id: 11, 
    title: "The Complete JavaScript Course 2024: From Zero to Expert!", 
    platform: "Udemy", 
    totalHours: 68, 
    image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Section 1: JavaScript Fundamentals",
        lessons: [
          { title: "Values and Variables", duration: 8, videoUrl: "https://www.youtube.com/watch?v=PZnJ2v7oM3o" },
          { title: "Basic Operators", duration: 10, videoUrl: "https://www.youtube.com/watch?v=l_tL6Ff0E6w" }
        ]
      },
      {
        title: "Section 2: DOM Manipulation",
        lessons: [
          { title: "Selecting Elements", duration: 12, videoUrl: "https://www.youtube.com/watch?v=y17RuWUpclg" },
          { title: "Handling Events", duration: 15, videoUrl: "https://www.youtube.com/watch?v=_B5_A1k8eUU" }
        ]
      }
    ]
  },
  { 
    id: 12, 
    title: "AWS Certified Solutions Architect - Associate", 
    platform: "Udemy", 
    totalHours: 27, 
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Section 1: IAM & EC2",
        lessons: [
          { title: "IAM Basics", duration: 10, videoUrl: "https://www.youtube.com/watch?v=3hLmDS179YE" },
          { title: "EC2 Fundamentals", duration: 15, videoUrl: "https://www.youtube.com/watch?v=lKkq0E3JMBk" }
        ]
      },
      {
        title: "Section 2: S3 & Storage",
        lessons: [
          { title: "S3 Buckets", duration: 12, videoUrl: "https://www.youtube.com/watch?v=e6w9LwZJFIA" },
          { title: "Storage Classes", duration: 14, videoUrl: "https://www.youtube.com/watch?v=oEemA4A152o" }
        ]
      }
    ]
  },
  { 
    id: 13, 
    title: "IBM Data Science Professional Certificate", 
    platform: "Coursera", 
    totalHours: 120, 
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Course 1: Python for Data Science",
        lessons: [
          { title: "Python Basics", duration: 10, videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8" },
          { title: "Data Structures in Python", duration: 15, videoUrl: "https://www.youtube.com/watch?v=R-HLU9Fl5ug" }
        ]
      },
      {
        title: "Course 2: Data Analysis",
        lessons: [
          { title: "Pandas Intro", duration: 12, videoUrl: "https://www.youtube.com/watch?v=dcqPhpY7tWk" },
          { title: "Data Wrangling", duration: 18, videoUrl: "https://www.youtube.com/watch?v=sz0D1f8A3bU" }
        ]
      }
    ]
  },
  { 
    id: 14, 
    title: "Google Cybersecurity Professional Certificate", 
    platform: "Coursera", 
    totalHours: 150, 
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Course 1: Foundations of Cybersecurity",
        lessons: [
          { title: "Security Principles", duration: 10, videoUrl: "https://www.youtube.com/watch?v=inWWhr5tnEA" },
          { title: "Threat Actors", duration: 15, videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc" }
        ]
      },
      {
        title: "Course 2: Network Security",
        lessons: [
          { title: "Network Architecture", duration: 12, videoUrl: "https://www.youtube.com/watch?v=f0b8XN4wUQA" },
          { title: "Firewalls and VPNs", duration: 18, videoUrl: "https://www.youtube.com/watch?v=KDsqmQh5sXo" }
        ]
      }
    ]
  },
  { 
    id: 15, 
    title: "Docker Mastery: with Kubernetes +Swarm", 
    platform: "Udemy", 
    totalHours: 21, 
    image: "https://images.unsplash.com/photo-1605745341112-85968b19335b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Section 1: Docker Containers",
        lessons: [
          { title: "Running Containers", duration: 8, videoUrl: "https://www.youtube.com/watch?v=fqMOXVR9hNM" },
          { title: "Container CLI", duration: 12, videoUrl: "https://www.youtube.com/watch?v=3c-iZaI7nLE" }
        ]
      },
      {
        title: "Section 2: Docker Images",
        lessons: [
          { title: "Building Images", duration: 15, videoUrl: "https://www.youtube.com/watch?v=LQjaJIFJ_X0" },
          { title: "Dockerfile Basics", duration: 18, videoUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE" }
        ]
      }
    ]
  },
  { 
    id: 16, 
    title: "UI / UX Design Specialization", 
    platform: "Coursera", 
    totalHours: 80, 
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Course 1: Visual Elements of UI Design",
        lessons: [
          { title: "Color Theory", duration: 10, videoUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU" },
          { title: "Typography", duration: 12, videoUrl: "https://www.youtube.com/watch?v=sByzHoiYZE0" }
        ]
      },
      {
        title: "Course 2: UX Research",
        lessons: [
          { title: "User Personas", duration: 15, videoUrl: "https://www.youtube.com/watch?v=7X9F1k6pT7Y" },
          { title: "Wireframing", duration: 18, videoUrl: "https://www.youtube.com/watch?v=Xh1j97wzEGE" }
        ]
      }
    ]
  },
  { 
    id: 17, 
    title: "Next.js 14 & React - The Complete Guide", 
    platform: "Udemy", 
    totalHours: 35, 
    image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Section 1: Next.js Essentials",
        lessons: [
          { title: "App Router Intro", duration: 8, videoUrl: "https://www.youtube.com/watch?v=ZVnjOPwW4ZA" },
          { title: "Pages and Layouts", duration: 12, videoUrl: "https://www.youtube.com/watch?v=xIRgA1mGDEQ" }
        ]
      },
      {
        title: "Section 2: Data Fetching",
        lessons: [
          { title: "Server Components", duration: 15, videoUrl: "https://www.youtube.com/watch?v=T_X-nIQ9E4c" },
          { title: "Server Actions", duration: 18, videoUrl: "https://www.youtube.com/watch?v=p0A3mF4s4cM" }
        ]
      }
    ]
  },
  { 
    id: 18, 
    title: "Java Programming Masterclass covering Java 11 & Java 17", 
    platform: "Udemy", 
    totalHours: 80, 
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Section 1: Java Basics",
        lessons: [
          { title: "Installing Java", duration: 5, videoUrl: "https://www.youtube.com/watch?v=eIrMbAQSU34" },
          { title: "Variables in Java", duration: 10, videoUrl: "https://www.youtube.com/watch?v=A74TOX803D0" }
        ]
      },
      {
        title: "Section 2: OOP in Java",
        lessons: [
          { title: "Classes and Objects", duration: 15, videoUrl: "https://www.youtube.com/watch?v=a199KZGMNxk" },
          { title: "Inheritance", duration: 18, videoUrl: "https://www.youtube.com/watch?v=QsB_x_d9dOQ" }
        ]
      }
    ]
  },
  { 
    id: 19, 
    title: "Prompt Engineering for ChatGPT", 
    platform: "Coursera", 
    totalHours: 18, 
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Course 1: Prompt Basics",
        lessons: [
          { title: "What is a Prompt?", duration: 8, videoUrl: "https://www.youtube.com/watch?v=jC4v5AS4ART" },
          { title: "Zero-Shot Prompting", duration: 10, videoUrl: "https://www.youtube.com/watch?v=680OQ_jY52U" }
        ]
      },
      {
        title: "Course 2: Advanced Prompts",
        lessons: [
          { title: "Few-Shot Prompting", duration: 12, videoUrl: "https://www.youtube.com/watch?v=dOxUroR57hs" },
          { title: "Chain of Thought", duration: 15, videoUrl: "https://www.youtube.com/watch?v=W0l4L8E6H58" }
        ]
      }
    ]
  },
  { 
    id: 20, 
    title: "Unreal Engine 5 C++ Developer: Learn C++ and Make Video Games", 
    platform: "Udemy", 
    totalHours: 30, 
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    modules: [
      {
        title: "Section 1: UE5 Basics",
        lessons: [
          { title: "Editor Navigation", duration: 10, videoUrl: "https://www.youtube.com/watch?v=k-zMkJMCEAQ" },
          { title: "Blueprints Intro", duration: 12, videoUrl: "https://www.youtube.com/watch?v=5Vz1yI9w24E" }
        ]
      },
      {
        title: "Section 2: C++ in UE5",
        lessons: [
          { title: "C++ Actor Classes", duration: 15, videoUrl: "https://www.youtube.com/watch?v=vLnPwxZdW4Y" },
          { title: "Game Modes", duration: 18, videoUrl: "https://www.youtube.com/watch?v=k6-L23vQv2w" }
        ]
      }
    ]
  }
];

function Courses() {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);
  const [addedCourses, setAddedCourses] = useState(new Set());
  useTheme(); // Initialize theme

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleAddCourse = async (course) => {
    setLoadingId(course.id);
    try {
      await API.post(
        "/courses",
        {
          title: course.title,
          platform: course.platform,
          totalHours: course.totalHours,
          modules: course.modules || [],
        }
      );
      setAddedCourses(prev => new Set(prev).add(course.id));
      toast.success("Course added to dashboard!");
    } catch (error) {
      console.error(error);
      toast.error(`Failed to add course: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="dashboard-page-wrapper" style={{ color: "var(--text-main)" }}>
      <style>{`
        .course-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .course-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
        .action-btn { transition: all 0.2s ease; }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
        .action-btn:active:not(:disabled) { transform: translateY(0); }
        .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        
        /* Tablet Layout: Balanced spacing & 2-column sections */
        @media (min-width: 769px) and (max-width: 1024px) {
          .courses-grid { grid-template-columns: repeat(2, 1fr); }
        }
        /* Mobile Layout: Stack elements vertically */
        @media (max-width: 768px) {
          .courses-grid { grid-template-columns: 1fr; display: flex; flex-direction: column; }
          .courses-container { padding: 24px 16px !important; }
          .courses-title { font-size: 28px !important; }
        }
      `}</style>
      <Navbar />
      <div className="courses-container" style={{ padding: "40px 16px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <h1 className="courses-title" style={{ fontSize: "32px", fontWeight: "700", marginBottom: "20px" }}>Explore Courses</h1>
        <p style={{ fontSize: "18px", color: "var(--text-muted)", marginBottom: "40px" }}>
          Browse our catalog of popular courses to add to your learning journey.
        </p>
        
        <div className="courses-grid">
          {AVAILABLE_COURSES.map(course => (
            <div key={course.id} className="course-card" style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border-color)", background: "var(--bg-card)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              <img src={course.image} alt={course.title} style={{ width: "100%", height: "160px", objectFit: "cover", borderBottom: "1px solid var(--border-color)" }} />
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <h3 style={{ marginTop: 0, fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "var(--text-main)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{course.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "4px", marginTop: 0 }}>{course.platform}</p>
                <p style={{ color: "var(--text-main)", fontSize: "14px", fontWeight: "bold", marginBottom: "20px", marginTop: 0 }}>{course.totalHours} total hours</p>
                <div style={{ marginTop: "auto" }}>
                  <button
                    className="action-btn"
                    onClick={() => addedCourses.has(course.id) ? navigate("/dashboard") : handleAddCourse(course)}
                    disabled={loadingId === course.id}
                    style={{ width: "100%", padding: "12px", background: loadingId === course.id ? "var(--primary-disabled)" : addedCourses.has(course.id) ? "var(--success)" : "var(--primary)", color: "var(--btn-text)", border: "none", cursor: loadingId === course.id ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "16px", transition: "background 0.3s" }}
                  >
                    {loadingId === course.id ? "Adding..." : addedCourses.has(course.id) ? "Go to Dashboard ➔" : "Add to Dashboard"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Courses;