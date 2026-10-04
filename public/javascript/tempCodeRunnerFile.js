 
function showteacherdata(){
  const now  = new Date();
  const dayname = now.toDateString("en-us",{
    weekday : "long",
    timeZone : "Asia/kolkata"
  });
  const current_time = now.getHours()*60 + now.getMinutes();

  const current_lec = facultytimetabel.findIndex((lecture) =>{
    const start = toMinutes(lecture.start_time);
    const end  = toMinutes(lecture.end_time);
    return current_time >= start && current_time <=end ;
  })
    console.log("current lec " ,current_lec);
    
  

}