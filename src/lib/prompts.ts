export const truths = [
  "What is the most embarrassing thing you've ever done?",
  "What is the biggest lie you've ever told?",
  "Who was your first crush?",
  "What is the most childish thing you still do?",
  "What is your worst habit?",
  "Have you ever peed in a pool?",
  "What's the longest you've gone without showering?",
  "Have you ever snooped through someone else's phone?",
  "What's the worst date you've ever been on?",
  "What is a secret you've never told anyone?",
  "Have you ever faked being sick to get out of something?",
  "What's the most embarrassing photo of you?",
  "Who in this room would you least want to be stuck on a desert island with?",
  "What is the strangest dream you've ever had?",
  "Have you ever stolen anything?",
  "What's the most awkward romantic encounter you've had?",
  "What is your biggest fear?",
  "Have you ever blamed a fart on someone else?",
  "What's the dumbest thing you've done to impress someone?",
  "If you had to swap lives with someone in this room for a day, who would it be?"
];

export const dares = [
  "Do your best impression of a baby being born.",
  "Let another player text someone from your phone.",
  "Eat a spoonful of hot sauce or mustard.",
  "Do a silly dance for 30 seconds with no music.",
  "Let the group give you a new hairstyle.",
  "Speak in a weird accent for the next 3 rounds.",
  "Post an embarrassing photo on your social media.",
  "Do 20 pushups.",
  "Let someone draw a mustache on your face with a pen.",
  "Call a random contact and sing them 'Happy Birthday'.",
  "Try to juggle 3 items the group chooses.",
  "Pretend to be a dog and fetch something from across the room.",
  "Let the group tickle you for 30 seconds.",
  "Talk without closing your mouth for the next round.",
  "Put a piece of ice down your shirt.",
  "Do a plank for as long as you can.",
  "Take an unflattering selfie and make it your profile picture for a day.",
  "Eat a raw slice of onion.",
  "Act like a monkey until it's your turn again.",
  "Let another player redo your makeup or draw on your face blindly."
];

export function getRandomPrompt(type: 'truth' | 'dare') {
  const list = type === 'truth' ? truths : dares;
  return list[Math.floor(Math.random() * list.length)];
}
