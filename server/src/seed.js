import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/db.js';
import User from './models/User.js';
import ProblemSheet from './models/ProblemSheet.js';
import Assignment from './models/Assignment.js';
import PracticeRoom from './models/PracticeRoom.js';
import Announcement from './models/Announcement.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not configured in .env');
    process.exit(1);
  }

  await connectDB(MONGODB_URI);
  console.log('Seeding CP Club database with initial data...');

  // 1. Users
  let admin = await User.findOne({ email: 'admin@cpclub.org' });
  if (!admin) {
    admin = await User.create({
      name: 'Club Administrator',
      email: 'admin@cpclub.org',
      passwordHash: 'AdminPassword123!',
      role: 'admin',
      codeforcesHandle: 'tourist',
      codeforcesProfile: {
        handle: 'tourist',
        rating: 3950,
        maxRating: 4009,
        rank: 'legendary grandmaster',
        maxRank: 'legendary grandmaster',
      },
    });
    console.log('Created Admin user: admin@cpclub.org / AdminPassword123!');
  }

  let mentor = await User.findOne({ email: 'mentor@cpclub.org' });
  if (!mentor) {
    mentor = await User.create({
      name: 'Alex Mentor',
      email: 'mentor@cpclub.org',
      passwordHash: 'MentorPassword123!',
      role: 'mentor',
      codeforcesHandle: 'Petr',
      codeforcesProfile: {
        handle: 'Petr',
        rating: 2900,
        maxRating: 3100,
        rank: 'international grandmaster',
        maxRank: 'legendary grandmaster',
      },
    });
    console.log('Created Mentor user: mentor@cpclub.org / MentorPassword123!');
  }

  let student = await User.findOne({ email: 'student@cpclub.org' });
  if (!student) {
    student = await User.create({
      name: 'Aryan Student',
      email: 'student@cpclub.org',
      passwordHash: 'StudentPassword123!',
      role: 'student',
      codeforcesHandle: 'Benq',
      codeforcesProfile: {
        handle: 'Benq',
        rating: 3200,
        maxRating: 3800,
        rank: 'legendary grandmaster',
        maxRank: 'legendary grandmaster',
      },
    });
    console.log('Created Student user: student@cpclub.org / StudentPassword123!');
  }

  // 2. Problem Sheets
  const sheetCount = await ProblemSheet.countDocuments();
  let beginnerSheet = null;
  if (sheetCount === 0) {
    beginnerSheet = await ProblemSheet.create({
      title: 'Beginner Foundations: Implementation & Math',
      description: 'Crucial entry-level problems to build code fluency and handle common competitive programming corner cases.',
      difficulty: 'beginner',
      topic: 'Implementation & Math',
      status: 'published',
      createdBy: mentor._id,
      problems: [
        { name: 'Watermelon', contestId: 4, index: 'A', rating: 800, tags: ['math', 'brute force'], url: 'https://codeforces.com/problemset/problem/4/A' },
        { name: 'Way Too Long Words', contestId: 71, index: 'A', rating: 800, tags: ['strings'], url: 'https://codeforces.com/problemset/problem/71/A' },
        { name: 'Next Round', contestId: 158, index: 'A', rating: 800, tags: ['implementation'], url: 'https://codeforces.com/problemset/problem/158/A' },
        { name: 'Domino piling', contestId: 50, index: 'A', rating: 800, tags: ['greedy', 'math'], url: 'https://codeforces.com/problemset/problem/50/A' },
        { name: 'Bit++', contestId: 282, index: 'A', rating: 800, tags: ['implementation'], url: 'https://codeforces.com/problemset/problem/282/A' },
      ],
    });

    await ProblemSheet.create({
      title: 'Intermediate: Classical Dynamic Programming',
      description: 'Master transition functions, memoization arrays, and state compression across 1D and 2D DP problems.',
      difficulty: 'medium',
      topic: 'Dynamic Programming',
      status: 'published',
      createdBy: mentor._id,
      problems: [
        { name: 'Cut Ribbon', contestId: 189, index: 'A', rating: 1300, tags: ['dp', 'brute force'], url: 'https://codeforces.com/problemset/problem/189/A' },
        { name: 'Boredom', contestId: 455, index: 'A', rating: 1500, tags: ['dp'], url: 'https://codeforces.com/problemset/problem/455/A' },
        { name: 'Given Length and Sum of Digits', contestId: 489, index: 'C', rating: 1400, tags: ['dp', 'greedy'], url: 'https://codeforces.com/problemset/problem/489/C' },
        { name: 'k-Tree', contestId: 431, index: 'C', rating: 1600, tags: ['dp', 'trees'], url: 'https://codeforces.com/problemset/problem/431/C' },
        { name: 'Tetrahedron', contestId: 166, index: 'E', rating: 1500, tags: ['dp', 'math'], url: 'https://codeforces.com/problemset/problem/166/E' },
      ],
    });

    await ProblemSheet.create({
      title: 'Advanced: Graphs & Tree Traversal',
      description: 'Deep dive into DFS, BFS, DSU (Disjoint Set Union), and tree traversal algorithms.',
      difficulty: 'hard',
      topic: 'Graphs & Trees',
      status: 'published',
      createdBy: admin._id,
      problems: [
        { name: 'News Distribution', contestId: 1167, index: 'C', rating: 1400, tags: ['dsu', 'dfs and similar'], url: 'https://codeforces.com/problemset/problem/1167/C' },
        { name: 'Linova and Kingdom', contestId: 1336, index: 'A', rating: 1600, tags: ['dfs and similar', 'trees', 'greedy'], url: 'https://codeforces.com/problemset/problem/1336/A' },
        { name: 'Journey', contestId: 839, index: 'C', rating: 1500, tags: ['dfs and similar'], url: 'https://codeforces.com/problemset/problem/839/C' },
        { name: 'Shortest Path with Obstacle', contestId: 1547, index: 'A', rating: 800, tags: ['math', 'implementation'], url: 'https://codeforces.com/problemset/problem/1547/A' },
      ],
    });

    console.log('Created 3 curated Problem Sheets.');
  }

  // 3. Announcements
  const annCount = await Announcement.countDocuments();
  if (annCount === 0) {
    await Announcement.create({
      title: '🏆 Welcome to the CP Club Platform!',
      content: 'Welcome everyone! Connect your Codeforces handle in your Profile to automatically track your rating progression, contest performances, and solve verified problems from our mentor-curated problem sheets.',
      author: admin._id,
      audience: 'all',
      status: 'published',
      publishedAt: new Date(),
    });

    await Announcement.create({
      title: '⚡ Codeforces Round #980 Mock Contest this Saturday',
      content: 'We will be hosting a timed virtual practice room this Saturday from 6:00 PM to 8:00 PM. Make sure to RSVP in the Practice Rooms tab. Peer scoreboard will be updated in real time!',
      author: mentor._id,
      audience: 'all',
      status: 'published',
      publishedAt: new Date(),
    });

    console.log('Created initial Announcements.');
  }

  // 4. Practice Room
  const roomCount = await PracticeRoom.countDocuments();
  if (roomCount === 0) {
    const now = new Date();
    const startTime = new Date(now.getTime() - 1000 * 60 * 30); // started 30 mins ago
    const endTime = new Date(now.getTime() + 1000 * 60 * 90); // ends in 90 mins

    await PracticeRoom.create({
      name: 'Weekly Sprint Round #1',
      description: 'Fast-paced speed round testing implementation and basic greedy strategies.',
      startTime,
      endTime,
      host: mentor._id,
      status: 'active',
      visibility: 'public',
      problems: [
        { name: 'Watermelon', contestId: 4, index: 'A', rating: 800, url: 'https://codeforces.com/problemset/problem/4/A' },
        { name: 'Way Too Long Words', contestId: 71, index: 'A', rating: 800, url: 'https://codeforces.com/problemset/problem/71/A' },
        { name: 'Cut Ribbon', contestId: 189, index: 'A', rating: 1300, url: 'https://codeforces.com/problemset/problem/189/A' },
      ],
      participants: [
        { user: student._id, joinedAt: new Date(), solvedKeys: ['4-A', '71-A'] },
        { user: mentor._id, joinedAt: new Date(), solvedKeys: ['4-A', '71-A', '189-A'] },
      ],
    });
    console.log('Created active Practice Room.');
  }

  // 5. Assignment
  const assignCount = await Assignment.countDocuments();
  if (assignCount === 0 && beginnerSheet) {
    const dueDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days from now
    await Assignment.create({
      problemSheet: beginnerSheet._id,
      assignedBy: mentor._id,
      assignedTo: student._id,
      batch: '2026',
      instructions: 'Solve at least 4 out of the 5 problems from the beginner sheet to satisfy this week\'s practice requirement.',
      dueDate,
    });
    console.log('Created active Assignment for student.');
  }

  console.log('✅ Seed completed successfully!');
  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
