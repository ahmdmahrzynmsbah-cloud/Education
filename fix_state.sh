#!/bin/bash
sed -i '/const \[activeLesson, setActiveLesson\] = useState<Lesson | null>(null);/a \  const [reviews, setReviews] = useState<Review[]>([]);\n  const [rating, setRating] = useState(5);\n  const [comment, setComment] = useState("");\n  const [isSubmittingReview, setIsSubmittingReview] = useState(false);' src/components/CourseDetails.tsx
