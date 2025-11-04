import { supabase } from '@/integrations/supabase/client';

export const blogPostsData = [
  {
    title: 'New High-Performance Workstations Installed in Lab A',
    excerpt: 'The Software Development Centre has recently upgraded all workstations in Lab A with the latest high-performance computing systems to support advanced software development and research projects.',
    content: `<h2>Major Technology Upgrade</h2>

<p>The Software Development Centre is excited to announce a significant upgrade to Lab A facilities. All workstations have been replaced with state-of-the-art high-performance computing systems designed to support the most demanding software development and research projects.</p>

<h3>New Features Include:</h3>
<ul>
<li>Intel Core i9 processors with 32GB RAM</li>
<li>NVIDIA RTX graphics cards for AI/ML workloads</li>
<li>1TB NVMe SSDs for lightning-fast storage</li>
<li>Dual 27-inch 4K monitors</li>
<li>High-speed networking infrastructure</li>
</ul>

<p>These upgrades will enable students and researchers to work on advanced projects including machine learning, 3D modeling, game development, and large-scale data analysis. The new systems are available for booking starting immediately.</p>`,
    image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    author: { name: 'Pro Eugene Maposa', avatar_initials: 'EM', bio: 'Professor of Software Engineering at NUST' },
    created_at: '2024-03-15',
  },
  {
    title: 'Upcoming Workshop Series: Web Development Fundamentals',
    excerpt: 'Join us for a series of workshops covering HTML, CSS, JavaScript, and modern web frameworks. Perfect for beginners and those looking to refresh their skills.',
    content: `<h2>Learn Web Development from the Ground Up</h2>

<p>The Software Development Centre is launching an exciting new workshop series focused on web development fundamentals. Whether you're a complete beginner or looking to refresh your skills, these hands-on workshops will provide comprehensive coverage of essential web technologies.</p>

<h3>Workshop Schedule:</h3>
<ul>
<li><strong>Week 1:</strong> HTML & CSS Basics</li>
<li><strong>Week 2:</strong> JavaScript Fundamentals</li>
<li><strong>Week 3:</strong> Modern Frameworks (React)</li>
<li><strong>Week 4:</strong> Building Your First Project</li>
</ul>

<p>All workshops include practical exercises and real-world project examples. Space is limited, so register early to secure your spot!</p>`,
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80',
    author: { name: 'Dr Tatenda Ndoro', avatar_initials: 'TN', bio: 'Senior Lecturer in Computer Science' },
    created_at: '2024-03-20',
  },
  {
    title: 'Extended Hours During Exam Period',
    excerpt: 'The Software Development Centre will extend its operating hours during the upcoming exam period to provide students with additional access to resources and study spaces.',
    content: `<h2>Supporting Students During Exams</h2>

<p>We understand the importance of having access to quality study spaces and computing resources during the exam period. The Software Development Centre will be extending its operating hours to better serve our students.</p>

<h3>Extended Hours:</h3>
<ul>
<li><strong>Weekdays:</strong> 7:00 AM - 11:00 PM</li>
<li><strong>Weekends:</strong> 9:00 AM - 9:00 PM</li>
<li><strong>Duration:</strong> Throughout the entire exam period</li>
</ul>

<p>All facilities will remain available including computer labs, study spaces, and printing services. Additional staff will be on hand to provide technical support during extended hours.</p>`,
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    author: { name: 'Admin Team', avatar_initials: 'AT', bio: 'Software Development Centre Administration' },
    created_at: '2024-03-25',
  },
  {
    title: 'Student Project Showcase: Innovations in AI',
    excerpt: 'Explore the remarkable AI projects developed by NUST students using the Software Development Centre resources. From machine learning applications to natural language processing solutions.',
    content: `<h2>Celebrating Student Innovation</h2>

<p>The Software Development Centre is proud to showcase some of the incredible AI projects developed by NUST students. These projects demonstrate the practical application of machine learning and artificial intelligence concepts learned in the classroom.</p>

<h3>Featured Projects:</h3>
<ul>
<li><strong>Smart Campus Navigation:</strong> An AI-powered mobile app that helps students navigate the NUST campus</li>
<li><strong>Automated Grading System:</strong> Machine learning model for automated assignment grading</li>
<li><strong>Voice-Activated Assistant:</strong> Natural language processing chatbot for student queries</li>
<li><strong>Predictive Analytics Dashboard:</strong> Data visualization tool for academic performance trends</li>
</ul>

<p>These projects utilized our high-performance computing resources and AI development tools. We invite all students to attend the showcase event to learn more about these innovative solutions.</p>`,
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    author: { name: 'Dr Noel Nklala', avatar_initials: 'NN', bio: 'AI Research Lead at NUST' },
    created_at: '2024-04-01',
  },
  {
    title: 'New Software Licenses Available for Student Projects',
    excerpt: 'The SDC has acquired new software licenses for industry-standard tools including Adobe Creative Suite, AutoCAD, and specialized development environments.',
    content: `<h2>Access to Professional Tools</h2>

<p>The Software Development Centre has invested in new software licenses to provide students with access to industry-standard professional tools. These licenses are now available for use on all SDC workstations.</p>

<h3>Newly Available Software:</h3>
<ul>
<li><strong>Adobe Creative Suite:</strong> Photoshop, Illustrator, Premiere Pro, After Effects</li>
<li><strong>AutoCAD:</strong> Professional CAD software for engineering and design</li>
<li><strong>JetBrains Suite:</strong> IntelliJ IDEA, PyCharm, WebStorm, and more</li>
<li><strong>Microsoft Visual Studio Enterprise:</strong> Advanced development environment</li>
<li><strong>MATLAB:</strong> For numerical computing and data analysis</li>
</ul>

<p>All registered students can access these tools during SDC operating hours. Tutorials and documentation are available to help you get started with any of these professional applications.</p>`,
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    author: { name: 'Pro Eugene Maposa', avatar_initials: 'EM', bio: 'Professor of Software Engineering at NUST' },
    created_at: '2024-04-05',
  },
  {
    title: 'Collaboration with Industry Partners for Student Internships',
    excerpt: 'NUST has established new partnerships with leading tech companies to provide internship opportunities for students who regularly use the Software Development Centre.',
    content: `<h2>Bridge to Industry</h2>

<p>The Software Development Centre is excited to announce new partnerships with leading technology companies in Zimbabwe and across Africa. These collaborations will provide valuable internship opportunities for NUST students.</p>

<h3>Partner Companies:</h3>
<ul>
<li>Econet Wireless Zimbabwe</li>
<li>Cassava Smartech</li>
<li>Microsoft Africa Development Centre</li>
<li>IBM Research Africa</li>
<li>Local software development startups</li>
</ul>

<h3>Internship Benefits:</h3>
<ul>
<li>Real-world project experience</li>
<li>Mentorship from industry professionals</li>
<li>Potential for full-time employment</li>
<li>Networking opportunities</li>
<li>Competitive stipends</li>
</ul>

<p>Students who have actively used the SDC facilities and demonstrated strong technical skills will be given priority consideration. Applications open next month.</p>`,
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    author: { name: 'Dr Tatenda Ndoro', avatar_initials: 'TN', bio: 'Senior Lecturer in Computer Science' },
    created_at: '2024-04-10',
  },
];

export const seedBlogData = async () => {
  try {
    // First, insert all unique authors
    const uniqueAuthors = Array.from(
      new Map(blogPostsData.map(post => [post.author.name, post.author])).values()
    );

    const authorIds: Record<string, string> = {};

    for (const author of uniqueAuthors) {
      // Check if author already exists
      const { data: existingAuthor } = await supabase
        .from('blog_authors')
        .select('id, name')
        .eq('name', author.name)
        .maybeSingle();

      if (existingAuthor) {
        authorIds[author.name] = existingAuthor.id;
      } else {
        // Insert new author
        const { data: newAuthor, error } = await supabase
          .from('blog_authors')
          .insert({
            name: author.name,
            avatar_initials: author.avatar_initials,
            bio: author.bio,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error inserting author:', error);
          throw error;
        }

        if (newAuthor) {
          authorIds[author.name] = newAuthor.id;
        }
      }
    }

    // Now insert blog posts
    const postsToInsert = blogPostsData.map(post => ({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image_url: post.image_url,
      author_id: authorIds[post.author.name],
      published: true,
      created_at: post.created_at,
    }));

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(postsToInsert)
      .select();

    if (error) {
      console.error('Error inserting blog posts:', error);
      throw error;
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Error seeding blog data:', error);
    return { success: false, error };
  }
};
