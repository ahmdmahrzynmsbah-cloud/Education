#!/bin/bash
sed -i 's/<source src={activeLesson.videoUrl} type="video\/mp4" \/>/ /g' src/components/CourseDetails.tsx
sed -i 's/<video/<video src={activeLesson.videoUrl}/g' src/components/CourseDetails.tsx
