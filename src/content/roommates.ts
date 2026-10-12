/**
 * Hotel room pairings, shown to each attendee on the handbook's roommate card.
 *
 * Keyed by Admit Confirmation record id rather than by name: attendees can
 * edit their own names from the profile page, and a name-keyed list would
 * silently stop matching. The page shows each roommate's current profile. A
 * room may hold more than two people. An organizer is written as
 * `organizer("Liam Robins")`: a name in `organizers` shows with their photo,
 * and any other text (like "Organizer (TBD)") is shown exactly as written.
 *
 * Source: "DCMC Roommates (2).csv".
 */
export const ORGANIZER = "organizer";

/** An organizer sharing the room, by their name in `organizers`. */
export const organizer = (name: string) => `${ORGANIZER}:${name}`;

export const rooms: string[][] = [
  ["recK8FjRBvh8R5vkF", "reclSES7fvd9JRpVu"], // Hamid Dahouei & Ethan Chiu
  ["recr6HFn1AhtMeN4f", "reczLM268jlaBcbPo"], // Tuvimanyu Gautam & Jude Hawrani
  ["recLs4CDrgvWRmmkS", "recLNNUaHwHSuXGKl"], // Matan Shtepel & Andrew Wu
  ["recVWWW6abB13ci9Q", "recTEWqYWIyLeJrs6"], // Evan Lee & Roger Mao
  ["recOtZ787jqQ1BQJh", "recN2bKtgtNr3MKvv"], // Ethan Ding & Julius Olavarria
  ["recEm5Ru8tHCGpTaf", "recgHlEFtkTZ722bN"], // Kyler Zhou & Ricardo Bruinton
  ["recT9HG4M6uHR46KG", "rec81cuFb36OmP1Kl"], // Lincoln Peacock & Micah Hees
  ["rectu678uFu9O8BxA", "recF3ztOROD6Q9zjK"], // Carter Musheno & Michael Endrias
  ["recuuihD22cKzp8NV", "recx1Per4q5axK7ql"], // Paul Hindoian & Eli Stettner
  ["recBWBjlkS6p2m7VH", "recNqyowcNrn0GVaV"], // Thomas Rodskog & Aditya Kasarla
  ["recj1jdwWZP6YSw56", organizer("Organizer (TBD)")], // Shriyan Reyya
  ["recggzgD3saqliDK5", "rec1otnuwgVZWxNdu"], // Caitlin Mah & Liem Guan
  ["recNjSpDhkDDYwlRE", "recY5JjPwd3PF4yiz"], // Raen Kao & Mariya Mushtaq
  ["recQuK4Zveo0J2JfJ", "recgt3siqoAOdjmOM"], // Melina Susano & Maya Jen
  ["recalpOaqkQadjPv3", "recGzVx8SdqtV5inT"], // Nikhita Bhatt & Priyal Shrivastava
  ["recZpqRxTfN2e5zeW", "rec5IkimW67QARILk"], // Allegra Hoddie & Rocio Perales Valdes
  ["rec6FUtHq4Jg3CFhI", "recrbctgxZZdNjGS0"], // Gita Pavuluri & Ashlyn Lu
];
