const Course = require("../models/course");
const User = require("../models/user");
const Admin = require("../models/Admin");
const qrcode = require("qrcode");
const os = require("os");

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// CREATE COURSE
const createCourse = async (req, res) => {
  try {
    const { title, platform, totalHours, modules, category, difficulty, thumbnail, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Course title is required." });
    }
    if (!platform) {
      return res.status(400).json({ message: "Course platform is required." });
    }

    let calculatedTotalHours = Number(totalHours) || 0;

    // Auto-calculate totalHours if lessons have durations
    if (modules && Array.isArray(modules)) {
      let totalMins = 0;
      modules.forEach((mod) => {
        if (mod.lessons && Array.isArray(mod.lessons)) {
          mod.lessons.forEach((lesson) => {
            totalMins += Number(lesson.duration) || 0;
          });
        }
      });
      if (totalMins > 0) {
        calculatedTotalHours = Math.max(1, Math.ceil(totalMins / 60));
      }
    }

    if (calculatedTotalHours <= 0) {
      return res.status(400).json({ message: "Total expected hours must be greater than 0." });
    }

    const course = await Course.create({
      title,
      platform,
      totalHours: calculatedTotalHours,
      modules: modules || [],
      category,
      difficulty,
      thumbnail,
      description,
      user: req.user.id,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("courseAdded", course);
    }

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      user: req.user.id,
    }).lean();

    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const updateCourse = async (req, res) => {
  try {
    let updateData = { ...req.body };
    let updateQuery = { $set: updateData };

    let sessionTimeAdded = 0;
    if (updateData.timeSpent !== undefined) {
      const oldCourse = await Course.findById(req.params.id).lean();
      if (oldCourse) {
        const oldTimeSpent = Number(oldCourse.timeSpent) || 0;
        const newTimeSpent = Number(updateData.timeSpent) || 0;
        sessionTimeAdded = newTimeSpent - oldTimeSpent;
        
        // Generate or accept a study log entry if time was added
        if (sessionTimeAdded > 0) {
          if (!updateQuery.$push) updateQuery.$push = {};
          if (updateData.newLog) {
            updateQuery.$push.studyLogs = updateData.newLog;
          } else {
            updateQuery.$push.studyLogs = { date: new Date(), duration: Math.max(1, Math.round(sessionTimeAdded / 60)), notes: "" };
          }
        }
      }
    }

    if (updateData.newLog !== undefined) {
      delete updateQuery.$set.newLog;
    }

    // Auto-calculate progress if modules/lessons are provided
    if (updateData.modules) {
      let totalDuration = 0;
      let completedDuration = 0;
      let hasLessons = false;
      let totalLessons = 0;
      let completedLessons = 0;

      updateData.modules.forEach((mod) => {
        if (mod.lessons && Array.isArray(mod.lessons)) {
          mod.lessons.forEach((lesson) => {
            hasLessons = true;
            totalLessons += 1;
            if (lesson.completed) completedLessons += 1;
            const duration = Number(lesson.duration) || 0;
            totalDuration += duration;
            if (lesson.completed) completedDuration += duration;
          });
        }
      });

      if (hasLessons) {
        if (totalDuration > 0) {
          updateQuery.$set.progress = Math.round((completedDuration / totalDuration) * 100);
        } else if (totalLessons > 0) {
          // Fallback: Calculate progress based on lesson count if no durations were provided
          updateQuery.$set.progress = Math.round((completedLessons / totalLessons) * 100);
        }
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true, strict: false } // strict: false allows saving timeSpent even if not explicitly in the Mongoose schema
    ).lean();

    let updatedUser;
    if (sessionTimeAdded > 0) {
      let user = await User.findById(req.user.id).lean();
      let isUser = true;
      if (!user) {
        user = await Admin.findById(req.user.id).lean();
        isUser = false;
      }

      if (user) {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        let lastStudyDate = user.lastStudyDate;
        let currentStreak = user.studyStreak || 0;
        let todayStudyTime = user.todayStudyTime || 0;

        if (lastStudyDate !== todayStr) {
           const yesterday = new Date(now);
           yesterday.setDate(yesterday.getDate() - 1);
           const yesterdayStr = yesterday.toISOString().split('T')[0];

           if (lastStudyDate !== yesterdayStr) {
              currentStreak = 0;
           }
           todayStudyTime = 0;
        }

        const wasBelow10 = todayStudyTime < 600; // 600 seconds = 10 minutes
        todayStudyTime += sessionTimeAdded;
        const isNowAbove10 = todayStudyTime >= 600;

        if (wasBelow10 && isNowAbove10) {
           currentStreak += 1;
        }
        
        lastStudyDate = todayStr;
        updatedUser = { lastStudyDate, studyStreak: currentStreak, todayStudyTime };

        const model = isUser ? User : Admin;
        await model.findByIdAndUpdate(req.user.id, { $set: updatedUser }, { strict: false });
      }
    }

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("courseUpdated", course);
    }

    if (updatedUser) {
      res.json({ course, user: updatedUser });
    } else {
      res.json(course); // Keep backward compatibility just in case
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("courseDeleted", req.params.id);
    }

    res.json({
      message: "Course Deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET CERTIFICATE (HTML generated on server)
const getCertificate = async (req, res) => {
  try {
    // Ensure the course belongs to the user requesting it
    const course = await Course.findOne({ _id: req.params.id, user: req.user.id }).lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (course.progress !== 100) {
      return res.status(400).json({ message: "Course is not yet completed." });
    }

    let user = await User.findById(req.user.id).lean();
    if (!user) {
      user = await Admin.findById(req.user.id).lean();
    }

    const userName = user ? user.name : "A Dedicated Learner";
    
    let certId = course.certificateId;
    let dateCompleted = course.certificateIssuedAt 
      ? new Date(course.certificateIssuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    if (!certId) {
      // Generate and save a unique certificate ID if it doesn't exist
      certId = `UC-${course._id.toString().slice(-8).toUpperCase()}`;
      const courseToUpdate = await Course.findById(req.params.id);
      courseToUpdate.certificateId = certId;
      courseToUpdate.certificateIssuedAt = new Date();
      await courseToUpdate.save();
      dateCompleted = new Date(courseToUpdate.certificateIssuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    let host = req.get('host');
    if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
      host = host.replace(/localhost|127\.0\.0\.1/, getLocalIP());
    }
    const verificationUrl = `${req.protocol}://${host}/api/courses/public/certificate/${certId}`;
    const qrCodeDataUrl = await qrcode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H', margin: 2, width: 140 });

    const html = `
      <html>
        <head>
          <title>Certificate of Completion - ${course.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Montserrat:wght@300;400;600&display=swap');
            
            * {
              box-sizing: border-box;
            }

            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #1c1c1c;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            
            .cert-wrapper {
              width: 1050px;
              height: 750px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            
            .cert-container {
              background: #fffefb;
              width: 1050px;
              height: 750px;
              padding: 20px;
              position: relative;
              box-shadow: 0 20px 50px rgba(0,0,0,0.5);
              display: flex;
              flex-direction: column;
              flex-shrink: 0;
            }
            
            .cert-border {
              border: 4px solid #b8860b;
              outline: 2px solid #b8860b;
              outline-offset: -12px;
              padding: 40px;
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              background: linear-gradient(135deg, rgba(212,175,55,0.03) 0%, rgba(255,255,255,0) 50%, rgba(212,175,55,0.03) 100%);
              overflow: hidden;
              flex: 1;
            }
            
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-25deg);
              font-size: 180px;
              color: rgba(184, 134, 11, 0.03);
              font-family: 'Cinzel', serif;
              font-weight: 700;
              white-space: nowrap;
              z-index: 0;
              pointer-events: none;
            }
            
            .content {
              position: relative;
              z-index: 1;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            
            .middle {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              flex: 1;
              text-align: center;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              width: 100%;
              font-family: 'Montserrat', sans-serif;
              font-size: 12px;
              color: #888;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            
            .logo {
              font-family: 'Cinzel', serif;
              color: #b8860b;
              font-size: 28px;
              letter-spacing: 4px;
              margin-bottom: 20px;
              font-weight: 700;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            
            .title {
              font-family: 'Cinzel', serif;
              font-size: 56px;
              color: #2c3e50;
              margin: 0 0 10px 0;
              text-transform: uppercase;
              letter-spacing: 6px;
            }
            
            .subtitle {
              font-family: 'Montserrat', sans-serif;
              font-size: 18px;
              color: #b8860b;
              text-transform: uppercase;
              letter-spacing: 4px;
              margin-bottom: 30px;
              font-weight: 600;
            }
            
            .course-text {
              font-family: 'Montserrat', sans-serif;
              font-size: 16px;
              color: #555;
              margin-bottom: 15px;
              max-width: 700px;
              line-height: 1.8;
              font-weight: 300;
            }
            
            .name {
              font-family: 'Great Vibes', cursive;
              font-size: 72px;
              color: #1a1a1a;
              margin: 0 0 20px 0;
              line-height: 1.2;
              border-bottom: 2px solid #b8860b;
              padding: 0 40px 10px 40px;
              display: inline-block;
              text-align: center;
              max-width: 100%;
            }
            
            .course-title {
              font-family: 'Cinzel', serif;
              font-weight: 600;
              font-size: 26px; /* Slightly reduced for better fit */
              color: #2c3e50;
              margin: 0 0 20px 0;

              /* --- Text wrapping and overflow prevention --- */
              line-height: 1.4;
              max-width: 100%; /* Use full width of the parent content area */
              text-align: center;
              white-space: normal;
              overflow-wrap: break-word;
              word-wrap: break-word; /* Fallback for older browsers */
            }
            
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              width: 100%;
            }
            
            .signature-block {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 250px;
            }
            
            .signature-line {
              width: 100%;
              border-bottom: 1px solid #2c3e50;
              margin-bottom: 12px;
              height: 50px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-family: 'Great Vibes', cursive;
              font-size: 36px;
              color: #2c3e50;
            }
            
            .date-line {
              font-family: 'Montserrat', sans-serif;
              font-size: 20px;
              font-weight: 600;
              color: #2c3e50;
              letter-spacing: 1px;
            }
            
            .signature-text {
              font-family: 'Montserrat', sans-serif;
              font-size: 14px;
              color: #777;
              text-transform: uppercase;
              letter-spacing: 2px;
              font-weight: 600;
            }
            
            .qr-code-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            
            .qr-code-wrapper img {
              width: 120px;
              height: 120px;
              border: 4px solid #b8860b;
              padding: 4px;
              background: white;
            }
            
            .qr-text {
              font-family: 'Montserrat', sans-serif;
              font-size: 12px;
              color: #777;
              margin-top: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .seal-wrapper {
              position: relative;
              width: 140px;
              height: 140px;
              margin-bottom: -15px;
            }
            
            .ribbon {
              position: absolute;
              width: 40px;
              height: 60px;
              background: #8b0000;
              bottom: -20px;
              left: 20px;
              transform: rotate(15deg);
              z-index: 1;
            }
            .ribbon:after {
              content: '';
              position: absolute;
              bottom: -15px;
              left: 0;
              border-left: 20px solid #8b0000;
              border-right: 20px solid #8b0000;
              border-bottom: 15px solid transparent;
            }
            
            .ribbon.right {
              left: auto;
              right: 20px;
              transform: rotate(-15deg);
            }
            
            .seal {
              width: 140px;
              height: 140px;
              background: radial-gradient(circle, #e6c27a 0%, #b8860b 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              z-index: 2;
              box-shadow: 0 4px 15px rgba(0,0,0,0.3);
              border: 2px solid #daa520;
            }
            
            .seal-inner {
              width: 110px;
              height: 110px;
              border: 2px dashed #fff;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: 'Cinzel', serif;
              color: #fff;
              text-align: center;
              line-height: 1.2;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            }
            
            .seal-inner span {
              font-size: 24px;
              font-weight: 700;
              letter-spacing: 2px;
            }
            
            .seal-inner small {
              font-size: 10px;
              letter-spacing: 1px;
              margin-top: 5px;
              font-family: 'Montserrat', sans-serif;
            }
            
            @media print {
              body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; margin: 0; }
              .cert-wrapper { width: 100% !important; height: 100% !important; }
              .cert-container { box-shadow: none; max-width: none; border: none; padding: 0; width: 100%; height: 100%; transform: none !important; }
              @page { size: landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="cert-wrapper">
            <div class="cert-container">
              <div class="cert-border">
                <div class="watermark">EXCELLENCE</div>
                <div class="content">
                  <div class="header">
                    <div>Certificate ID: ${certId}</div>
                    <div>Date: ${dateCompleted}</div>
                  </div>
                  
                  <div class="middle">
                    <div class="logo">Edujourney</div>
                    <h1 class="title">Certificate</h1>
                    <p class="subtitle">Of Achievement</p>
                    
                    <p class="course-text">This is to proudly certify and acknowledge that</p>
                    <h2 class="name">${userName}</h2>
                    
                    <p class="course-text">has successfully completed the comprehensive curriculum, demonstrated exceptional proficiency, and met all requirements for the course</p>
                    <h3 class="course-title">${course.title}</h3>
                  </div>
                  
                  <div class="footer">
                    <div class="signature-block">
                      <div class="signature-line date-line">${dateCompleted}</div>
                      <div class="signature-text">Date Completed</div>
                    </div>
                    
                    <div class="qr-code-wrapper">
                      <img src="${qrCodeDataUrl}" alt="QR Code for Verification" />
                      <p class="qr-text">Scan to Verify</p>
                    </div>
                    
                    <div class="signature-block">
                      <div class="signature-line" style="font-size: 44px; padding-bottom: 5px;">Course Director</div>
                      <div class="signature-text">Authorized Signature</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <script>
            function scaleCertificate() {
              const container = document.querySelector('.cert-container');
              const wrapper = document.querySelector('.cert-wrapper');
              
              const availableWidth = window.innerWidth - 40;
              const availableHeight = window.innerHeight - 40;
              
              const scale = Math.min(availableWidth / 1050, availableHeight / 750, 1);
              
              container.style.transform = 'scale(' + scale + ')';
              container.style.transformOrigin = 'top left';
              
              wrapper.style.width = (1050 * scale) + 'px';
              wrapper.style.height = (750 * scale) + 'px';
            }
            
            window.addEventListener('resize', scaleCertificate);
            scaleCertificate();
          </script>
        </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PUBLIC CERTIFICATE (No authentication required, used for QR scanning)
const getPublicCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    // Find course by certificateId
    const course = await Course.findOne({ certificateId }).lean();

    if (!course) {
      return res.status(404).send("Certificate not found or invalid.");
    }

    // Find the user who owns this course
    let user = await User.findById(course.user).lean();
    if (!user) {
      user = await Admin.findById(course.user).lean();
    }

    const userName = user ? user.name : "A Dedicated Learner";
    const dateCompleted = course.certificateIssuedAt 
      ? new Date(course.certificateIssuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let host = req.get('host');
    if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
      host = host.replace(/localhost|127\.0\.0\.1/, getLocalIP());
    }
    const verificationUrl = `${req.protocol}://${host}/api/courses/public/certificate/${certificateId}`;
    const qrCodeDataUrl = await qrcode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H', margin: 2, width: 140 });

    // HTML Template (same as getCertificate)
    const html = `
      <html>
        <head>
          <title>Certificate of Completion - ${course.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Montserrat:wght@300;400;600&display=swap');
            
            * {
              box-sizing: border-box;
            }

            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #1c1c1c;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            
            .cert-wrapper {
              width: 1050px;
              height: 750px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            
            .cert-container {
              background: #fffefb;
              width: 1050px;
              height: 750px;
              padding: 20px;
              position: relative;
              box-shadow: 0 20px 50px rgba(0,0,0,0.5);
              display: flex;
              flex-direction: column;
              flex-shrink: 0;
            }
            
            .cert-border {
              border: 4px solid #b8860b;
              outline: 2px solid #b8860b;
              outline-offset: -12px;
              padding: 40px;
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              background: linear-gradient(135deg, rgba(212,175,55,0.03) 0%, rgba(255,255,255,0) 50%, rgba(212,175,55,0.03) 100%);
              overflow: hidden;
              flex: 1;
            }
            
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-25deg);
              font-size: 180px;
              color: rgba(184, 134, 11, 0.03);
              font-family: 'Cinzel', serif;
              font-weight: 700;
              white-space: nowrap;
              z-index: 0;
              pointer-events: none;
            }
            
            .content {
              position: relative;
              z-index: 1;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            
            .middle {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              flex: 1;
              text-align: center;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              width: 100%;
              font-family: 'Montserrat', sans-serif;
              font-size: 12px;
              color: #888;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            
            .logo {
              font-family: 'Cinzel', serif;
              color: #b8860b;
              font-size: 28px;
              letter-spacing: 4px;
              margin-bottom: 20px;
              font-weight: 700;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            
            .title {
              font-family: 'Cinzel', serif;
              font-size: 56px;
              color: #2c3e50;
              margin: 0 0 10px 0;
              text-transform: uppercase;
              letter-spacing: 6px;
            }
            
            .subtitle {
              font-family: 'Montserrat', sans-serif;
              font-size: 18px;
              color: #b8860b;
              text-transform: uppercase;
              letter-spacing: 4px;
              margin-bottom: 30px;
              font-weight: 600;
            }
            
            .course-text {
              font-family: 'Montserrat', sans-serif;
              font-size: 16px;
              color: #555;
              margin-bottom: 15px;
              max-width: 700px;
              line-height: 1.8;
              font-weight: 300;
            }
            
            .name {
              font-family: 'Great Vibes', cursive;
              font-size: 72px;
              color: #1a1a1a;
              margin: 0 0 20px 0;
              line-height: 1.2;
              border-bottom: 2px solid #b8860b;
              padding: 0 40px 10px 40px;
              display: inline-block;
              text-align: center;
              max-width: 100%;
            }
            
            .course-title {
              font-family: 'Cinzel', serif;
              font-weight: 600;
              font-size: 26px; /* Slightly reduced for better fit */
              color: #2c3e50;
              margin: 0 0 20px 0;

              /* --- Text wrapping and overflow prevention --- */
              line-height: 1.4;
              max-width: 100%; /* Use full width of the parent content area */
              text-align: center;
              white-space: normal;
              overflow-wrap: break-word;
              word-wrap: break-word; /* Fallback for older browsers */
            }
            
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              width: 100%;
            }
            
            .signature-block {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 250px;
            }
            
            .signature-line {
              width: 100%;
              border-bottom: 1px solid #2c3e50;
              margin-bottom: 12px;
              height: 50px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-family: 'Great Vibes', cursive;
              font-size: 36px;
              color: #2c3e50;
            }
            
            .date-line {
              font-family: 'Montserrat', sans-serif;
              font-size: 20px;
              font-weight: 600;
              color: #2c3e50;
              letter-spacing: 1px;
            }
            
            .signature-text {
              font-family: 'Montserrat', sans-serif;
              font-size: 14px;
              color: #777;
              text-transform: uppercase;
              letter-spacing: 2px;
              font-weight: 600;
            }
            
            .qr-code-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            
            .qr-code-wrapper img {
              width: 120px;
              height: 120px;
              border: 4px solid #b8860b;
              padding: 4px;
              background: white;
            }
            
            .qr-text {
              font-family: 'Montserrat', sans-serif;
              font-size: 12px;
              color: #777;
              margin-top: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .seal-wrapper {
              position: relative;
              width: 140px;
              height: 140px;
              margin-bottom: -15px;
            }
            
            .ribbon {
              position: absolute;
              width: 40px;
              height: 60px;
              background: #8b0000;
              bottom: -20px;
              left: 20px;
              transform: rotate(15deg);
              z-index: 1;
            }
            .ribbon:after {
              content: '';
              position: absolute;
              bottom: -15px;
              left: 0;
              border-left: 20px solid #8b0000;
              border-right: 20px solid #8b0000;
              border-bottom: 15px solid transparent;
            }
            
            .ribbon.right {
              left: auto;
              right: 20px;
              transform: rotate(-15deg);
            }
            
            .seal {
              width: 140px;
              height: 140px;
              background: radial-gradient(circle, #e6c27a 0%, #b8860b 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              z-index: 2;
              box-shadow: 0 4px 15px rgba(0,0,0,0.3);
              border: 2px solid #daa520;
            }
            
            .seal-inner {
              width: 110px;
              height: 110px;
              border: 2px dashed #fff;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: 'Cinzel', serif;
              color: #fff;
              text-align: center;
              line-height: 1.2;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            }
            
            .seal-inner span {
              font-size: 24px;
              font-weight: 700;
              letter-spacing: 2px;
            }
            
            .seal-inner small {
              font-size: 10px;
              letter-spacing: 1px;
              margin-top: 5px;
              font-family: 'Montserrat', sans-serif;
            }
            
            @media print {
              body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; margin: 0; }
              .cert-wrapper { width: 100% !important; height: 100% !important; }
              .cert-container { box-shadow: none; max-width: none; border: none; padding: 0; width: 100%; height: 100%; transform: none !important; }
              @page { size: landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="cert-wrapper">
            <div class="cert-container">
              <div class="cert-border">
                <div class="watermark">EXCELLENCE</div>
                <div class="content">
                  <div class="header">
                    <div>Certificate ID: ${certificateId}</div>
                    <div>Date: ${dateCompleted}</div>
                  </div>
                  
                  <div class="middle">
                    <div class="logo">Edujourney</div>
                    <h1 class="title">Certificate</h1>
                    <p class="subtitle">Of Achievement</p>
                    
                    <p class="course-text">This is to proudly certify and acknowledge that</p>
                    <h2 class="name">${userName}</h2>
                    
                    <p class="course-text">has successfully completed the comprehensive curriculum, demonstrated exceptional proficiency, and met all requirements for the course</p>
                    <h3 class="course-title">${course.title}</h3>
                  </div>
                  
                  <div class="footer">
                    <div class="signature-block">
                      <div class="signature-line date-line">${dateCompleted}</div>
                      <div class="signature-text">Date Completed</div>
                    </div>
                    
                    <div class="qr-code-wrapper">
                      <img src="${qrCodeDataUrl}" alt="QR Code for Verification" />
                      <p class="qr-text">Scan to Verify</p>
                    </div>
                    
                    <div class="signature-block">
                      <div class="signature-line" style="font-size: 44px; padding-bottom: 5px;">Course Director</div>
                      <div class="signature-text">Authorized Signature</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <script>
            function scaleCertificate() {
              const container = document.querySelector('.cert-container');
              const wrapper = document.querySelector('.cert-wrapper');
              
              const availableWidth = window.innerWidth - 40;
              const availableHeight = window.innerHeight - 40;
              
              const scale = Math.min(availableWidth / 1050, availableHeight / 750, 1);
              
              container.style.transform = 'scale(' + scale + ')';
              container.style.transformOrigin = 'top left';
              
              wrapper.style.width = (1050 * scale) + 'px';
              wrapper.style.height = (750 * scale) + 'px';
            }
            
            window.addEventListener('resize', scaleCertificate);
            scaleCertificate();
          </script>
        </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// IMPORT YOUTUBE PLAYLIST
const importYoutubePlaylist = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) {
      return res.status(400).json({ message: "YouTube Playlist URL is required." });
    }

    const playlistIdMatch = youtubeUrl.match(/[?&]list=([^#&?]+)/);
    if (!playlistIdMatch) {
      return res.status(400).json({ message: "Invalid YouTube Playlist URL. Ensure it contains 'list='." });
    }

    const playlistId = playlistIdMatch[1];
    const API_KEY = process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ message: "YOUTUBE_API_KEY is not configured. Please contact the administrator." });
    }

    // 1. Fetch Playlist Details
    const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`);
    const plData = await plRes.json();

    if (plData.error) throw new Error(plData.error.message);
    if (!plData.items || plData.items.length === 0) {
      return res.status(400).json({ message: "Playlist not found. Ensure the URL is correct and the playlist is public." });
    }

    const plTitle = plData.items[0].snippet.title;
    const plDescription = plData.items[0].snippet.description || "";

    // 2. Fetch All Playlist Items (with pagination)
    const allItems = [];
    let nextPageToken = null;
    let itemsCount = 0;
    const maxItems = 200; // Limit to 200 items to avoid excessive API calls

    do {
      const itemsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&pageToken=${nextPageToken || ''}&key=${API_KEY}`
      );
      const itemsData = await itemsRes.json();

      if (itemsData.error) throw new Error(itemsData.error.message);
      if (!itemsData.items || itemsData.items.length === 0) break;

      allItems.push(...itemsData.items);
      itemsCount += itemsData.items.length;
      nextPageToken = itemsData.nextPageToken || null;

      // Stop if we've reached the max
      if (itemsCount >= maxItems) break;
    } while (nextPageToken);

    if (allItems.length === 0) {
      return res.status(400).json({ message: "No videos found in the playlist. The videos may be private." });
    }

    const videoIds = allItems
      .filter(item => item.snippet.title !== "Private video" && item.snippet.title !== "Deleted video")
      .map(item => item.contentDetails.videoId);

    // 3. Fetch Video Durations (in batches of 50)
    const durationMap = {};
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${API_KEY}`
      );
      const videosData = await videosRes.json();

      if (videosData.items) {
        videosData.items.forEach(video => {
          // Parse ISO 8601 duration (e.g., PT1H2M10S)
          const match = video.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          const hours = parseInt(match?.[1]) || 0;
          const minutes = parseInt(match?.[2]) || 0;
          const seconds = parseInt(match?.[3]) || 0;
          durationMap[video.id] = Math.max(1, Math.ceil(hours * 60 + minutes + seconds / 60));
        });
      }
    }

    // 4. Map to Lessons
    const lessons = allItems
      .filter(item => item.snippet.title !== "Private video" && item.snippet.title !== "Deleted video")
      .map((item, index) => ({
        title: `${index + 1}. ${item.snippet.title}`,
        duration: durationMap[item.contentDetails.videoId] || 10,
        completed: false,
        videoUrl: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`
      }));

    // 5. Organize into modules (group lessons by ~15 lessons per module)
    const lessonsPerModule = 15;
    const modules = [];

    for (let i = 0; i < lessons.length; i += lessonsPerModule) {
      const moduleIndex = Math.floor(i / lessonsPerModule) + 1;
      const moduleLessons = lessons.slice(i, i + lessonsPerModule);
      
      modules.push({
        id: `mod-${Date.now()}-${moduleIndex}`,
        title: moduleIndex === 1 
          ? plTitle 
          : `${plTitle} - Part ${moduleIndex}`,
        lessons: moduleLessons
      });
    }

    res.json({
      title: plTitle,
      platform: "YouTube",
      description: plDescription,
      modules
    });
  } catch (error) {
    console.error("YouTube Import Error:", error);
    res.status(500).json({ message: error.message || "Failed to import YouTube playlist" });
  }
};

// VERIFY CERTIFICATE
const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    if (!certificateId) {
      return res.status(400).json({ message: "Certificate ID is required." });
    }

    const course = await Course.findOne({ certificateId }).populate('user', 'name').lean();

    if (!course) {
      return res.status(404).json({ message: "Certificate not found or invalid." });
    }

    res.status(200).json({
      verified: true,
      studentName: course.user.name,
      courseName: course.title,
      issueDate: course.certificateIssuedAt,
      certificateId: course.certificateId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during certificate verification." });
  }
};

// ADD MODULE TO COURSE
const addModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Module title is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if user owns the course
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course." });
    }

    const newModule = {
      title,
      lessons: []
    };

    course.modules.push(newModule);
    await course.save();

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("moduleAdded", { courseId, module: course.modules[course.modules.length - 1] });
    }

    res.status(201).json(course.modules[course.modules.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE MODULE ORDER (for drag-and-drop reordering)
const updateModuleOrder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { modules } = req.body;

    if (!Array.isArray(modules)) {
      return res.status(400).json({ message: "Modules must be an array." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if user owns the course
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course." });
    }

    course.modules = modules;
    await course.save();

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("modulesReordered", { courseId, modules });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE MODULE
const deleteModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if user owns the course
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course." });
    }

    course.modules = course.modules.filter((mod) => mod._id.toString() !== moduleId);
    await course.save();

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("moduleDeleted", { courseId, moduleId });
    }

    res.json({ message: "Module deleted successfully.", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD LESSON TO MODULE
const addLesson = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, duration = 0 } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Lesson title is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if user owns the course
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course." });
    }

    const module = course.modules.find((mod) => mod._id.toString() === moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module not found." });
    }

    const newLesson = {
      title,
      duration: Number(duration) || 0,
      completed: false,
    };

    module.lessons.push(newLesson);
    await course.save();

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("lessonAdded", { courseId, moduleId, lesson: module.lessons[module.lessons.length - 1] });
    }

    res.status(201).json(module.lessons[module.lessons.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE LESSON
const updateLesson = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const { title, duration, completed } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if user owns the course
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course." });
    }

    const module = course.modules.find((mod) => mod._id.toString() === moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module not found." });
    }

    const lesson = module.lessons.find((les) => les._id.toString() === lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    if (title !== undefined) lesson.title = title;
    if (duration !== undefined) lesson.duration = Number(duration);
    if (completed !== undefined) {
      lesson.completed = completed;
      if (completed) {
        lesson.completedAt = new Date();
      }
    }

    await course.save();

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("lessonUpdated", { courseId, moduleId, lesson });
    }

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE LESSON ORDER (for reordering within module)
const updateLessonOrder = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { lessons } = req.body;

    if (!Array.isArray(lessons)) {
      return res.status(400).json({ message: "Lessons must be an array." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if user owns the course
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course." });
    }

    const module = course.modules.find((mod) => mod._id.toString() === moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module not found." });
    }

    module.lessons = lessons;
    await course.save();

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("lessonsReordered", { courseId, moduleId, lessons });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE LESSON
const deleteLesson = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if user owns the course
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course." });
    }

    const module = course.modules.find((mod) => mod._id.toString() === moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module not found." });
    }

    module.lessons = module.lessons.filter((les) => les._id.toString() !== lessonId);
    await course.save();

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("lessonDeleted", { courseId, moduleId, lessonId });
    }

    res.json({ message: "Lesson deleted successfully.", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  getCertificate,
  getPublicCertificate,
  importYoutubePlaylist,
  addModule,
  updateModuleOrder,
  deleteModule,
  addLesson,
  updateLesson,
  updateLessonOrder,
  deleteLesson,
  verifyCertificate
};