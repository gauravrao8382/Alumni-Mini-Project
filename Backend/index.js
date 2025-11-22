const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
app.use(express.static(path.join(__dirname, '../Frontend')));

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const { v4: uuidv4 } = require("uuid");
const { console } = require('inspector');

const collageDataPath = path.join(__dirname, './collagedata.json');
const alumniDataPath = path.join(__dirname,'./alumnidata.json');
const eventsDataPath = path.join(__dirname,'./eventsdata.json');
const jobDataPath = path.join(__dirname,'./jobData.json');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images'))); // serve images

// Set EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// ---------------- SERVER START ----------------
app.listen(3000, () => console.log("Server running on port 3000"));

// ---------------- SEND HTML PAGES ----------------
app.get('/', (req, res) => res.sendFile(path.join(__dirname, "../Frontend/Home.html")));
app.get('/Registercollage', (req, res) => res.sendFile(path.join(__dirname, "../Frontend/RegisterCollage.html")));
app.get('/CollageSuccess', (req, res) => res.sendFile(path.join(__dirname, "../Frontend/CollageSuccess.html")));
app.get('/EmailexistCollage', (req, res) => res.sendFile(path.join(__dirname, "../Frontend/EmailexistCollage.html")));
app.get('/LoginCollage', (req, res) => res.sendFile(path.join(__dirname, "../Frontend/LoginCollage.html")));
app.get('/LogOutCollage', (req, res) => {
    res.redirect("/LoginCollage");
});
// ---------------- COLLAGE REGISTER ----------------
app.post('/RegisterCollage', async (req, res) => {
    const { name, email, password, address, image } = req.body;
    let users = JSON.parse(fs.readFileSync(collageDataPath, 'utf8'));

    if (users.find(u => u.email === email)) return res.send(`
        <script>
            alert("Email exist , Try to login !");
            window.location.href="/LoginCollage";
        </script>
    `);

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = {
        id: "COL-" + Math.floor(10000 + Math.random() * 90000),
        name,
        email,
        password: hashedPass,
        address,
        image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbkAWv33TAJ3SvPFni5qaPcVksmg7p4CSDOw&s"
    };

    users.push(newUser);
    fs.writeFileSync(collageDataPath, JSON.stringify(users, null, 2));

    res.redirect('/CollageSuccess');
});

// ---------------- COLLAGE LOGIN ----------------
app.post("/LoginCollage", (req, res) => {
    const { email, password } = req.body;

    if (!fs.existsSync(collageDataPath)) return res.send("No users found!");

    let users = JSON.parse(fs.readFileSync(collageDataPath, "utf8"));
    const user = users.find(u => u.email === email);
    if (!user) return res.send(`
        <script>
            alert("User not found!");
            window.location.href="/RegisterCollage";
        </script>
    `);

    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (!isMatch) return res.send(`
        <script>
            alert("Incorrect password!");
            window.location.href="/LoginCollage";
        </script>
    `);
        res.redirect(`/collagedashboard?email=${encodeURIComponent(user.email)}`);
    });
});

// ---------------- COLLAGE DASHBOARD ----------------
app.get('/collagedashboard', (req, res) => {
    const email = req.query.email;
    let users = JSON.parse(fs.readFileSync(collageDataPath, 'utf8'));
    const user = users.find(u => u.email === email);

    if (!user) return res.send("User not found!");

    res.render('collagedashboard', {
        name: user.name,
        email: user.email,
        collageID: user.id,
        address: user.address,
        image: user.image
    });
});

app.post('/collagedashboard',(req,res)=>{
    let {email, eventName, eventDate, eventDesc}=req.body;
    let events = JSON.parse(fs.readFileSync(eventsDataPath, 'utf8'));
    let id=uuidv4();
    const newEvent={
        email,
        id,
        eventName,
        eventDate,
        eventDesc
    }
    events.push(newEvent);
    fs.writeFileSync(eventsDataPath, JSON.stringify(events, null, 2));
    return res.send(`
        <script>
            alert("Event Added Successfully!");
            window.location.href="/collagedashboard?email=${email}";
        </script>
    `);
})
app.get('/events',(req,res)=>{
    const email = req.query.email;
    let events = JSON.parse(fs.readFileSync(eventsDataPath, 'utf8'));
    res.render("events",{events,email});
})

app.delete('/events/:id',(req,res)=>{
    const {id}=req.params;
    let events = JSON.parse(fs.readFileSync(eventsDataPath, 'utf8'));
    events=events.filter((e)=> e.id !== id);
    fs.writeFileSync(eventsDataPath, JSON.stringify(events, null, 2));
     return res.send(`
        <script>
        window.location.href="/events";
        </script>
     `);
})

app.get("/search",(req,res)=>{
    const email=req.query.email;
    const result=0;
    console.log("Hello I am here");
    res.render("search",{result,email});
})

app.post("/search",(req,res)=>{
    const email=req.query.email;
    const input=req.body.name.toLowerCase();
    let alumniList = JSON.parse(fs.readFileSync(alumniDataPath, 'utf8'));
    alumniList=alumniList.filter((a)=>a.collageEmail===email);
    const result=alumniList.filter(
        (a)=>
            a.name.toLowerCase()===input || 
            a.passingyear.toLowerCase()===input || 
            a.email.toLowerCase()===input
        )
    res.render("search",{result,email});
})

app.get("/jobs",(req,res)=>{
    const email=req.query.email;
    console.log("email");
    let jobs = JSON.parse(fs.readFileSync(jobDataPath, 'utf8'));
    jobs=jobs.filter((j)=> j.email === email)
    console.log(jobs.length);
    res.render("jobs",{jobs,email});
})

app.get("/jobs/new",(req,res)=>{
    const email=req.query.email;
    res.render("createjob",{email});
})

app.post("/jobs/new",(req,res)=>{
    const email=req.query.email;
    const {title, skills, package, experience, description} = req.body;
    let jobs = JSON.parse(fs.readFileSync(jobDataPath, 'utf8'));
    let id=uuidv4();
    const newJob={
        email,
        title,
        skills,
        package,
        experience,
        description,
    }
    jobs.push(newJob);
    fs.writeFileSync(jobDataPath, JSON.stringify(jobs, null, 2));
    return res.send(`
        <script>
            alert("Job Added Successfully!");
            window.location.href="/jobs?email=${email}";
        </script>
    `);
})




// ---------------- ALUMNI ROUTES ----------------
app.get('/AlumniRegister', (req, res) => res.sendFile(path.join(__dirname, "../Frontend/AlumniRegister.html")));
app.get('/AlumniLogin', (req, res) => res.sendFile(path.join(__dirname, "../Frontend/AlumniLogin.html")));
app.get('/AlumniSuccess', (req, res) => res.sendFile(path.join(__dirname, "../Frontend/AlumniSuccess.html")));
app.get('/EmailexistAlumni', (req, res) => res.sendFile(path.join(__dirname, "../Frontend/EmailexistAlumni.html")));
app.get('/AlumniLogOut', (req, res) => {
    res.redirect("/AlumniLogin");
});

app.post('/AlumniRegister', async (req, res) => {
    const { name, collageEmail, collagename
        , email, password, passingyear } = req.body;

    let collages = JSON.parse(fs.readFileSync(collageDataPath, 'utf8'));
    
    const validCollege = collages.find(c => c.email === collageEmail);
    if (!validCollege) {
        return res.send(`
            <script>
                alert("Invalid College email! Please enter correct College email.");
                window.location.href="/AlumniRegister";
            </script>
        `);
    }

    let users = JSON.parse(fs.readFileSync(alumniDataPath, 'utf8'));
    if (users.find(u => u.email === email))  return res.send(`
            <script>
                alert("Email exist, Try to login !");
                window.location.href="/AlumniRegister";
            </script>
        `);

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = {
        name,
        collagename,
        collageEmail,
        email,
        password: hashedPass,
        passingyear,
        image: "/images/default-college.png" // default image
    };

    users.push(newUser);
    fs.writeFileSync(alumniDataPath, JSON.stringify(users, null, 2));

    res.redirect('/AlumniSuccess');
});

// ---------------- COLLAGE LOGIN ----------------
app.post("/AlumniLogin", (req, res) => {
    const { email, password } = req.body;

    if (!fs.existsSync(alumniDataPath)) return res.send("No users found!");

    let users = JSON.parse(fs.readFileSync(alumniDataPath, "utf8"));
    const user = users.find(u => u.email === email);
    if (!user)  return res.send(`
            <script>
                alert("User not found !");
                window.location.href="/AlumniRegister";
            </script>
        `);

    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (!isMatch)  return res.send(`
            <script>
                alert("Incorrect password !");
                window.location.href="/AlumniLogin";
            </script>
        `);
        res.redirect(`/alumnidashboard?email=${encodeURIComponent(user.email)}`);
    });
});

// ---------------- COLLAGE DASHBOARD ----------------
app.get('/alumnidashboard', (req, res) => {
    const email = req.query.email;
    let users = JSON.parse(fs.readFileSync(alumniDataPath, 'utf8'));
    const user = users.find(u => u.email === email);

    if (!user) return res.send("User not found!");
    res.render('alumnidashboard', {
        name: user.name,
        collagename: user.collagename,
        collageEmail:user.collageEmail,
        email: user.email,
        passingyear: user.passingyear,
        image: user.image
    });
});