const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Create HTTP server so we can attach socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// expose io so route handlers can emit events (small, temporary shim)
try {
  global.staffIo = io;
} catch (e) {
  // ignore
}

//middleware
app.use(express.json()); //req body
app.use(cors());

// Socket.io connection logging
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('join', (data) => {
    try {
      if (data && data.role) socket.join(String(data.role));
    } catch (e) {}
  });
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

//ROUTES

//register and login routes

app.use('/auth', require('./routes/coopauth'));

//dashboard route
app.use('/dashboard', require('./routes/dashboardauth'));

//loan review routes
app.use('/api/loan-review', require('./routes/loanReview'));

// payment reference routes
app.use('/api/payments', require('./routes/payments'));
app.use('/api/user-management', require('./routes/userManagement'));
// accounts (savings/checking) routes
app.use('/api/accounts', require('./routes/accounts'));

// invoice routes
app.use('/api/invoices', require('./routes/invoices'));

// member import routes
app.use('/api', require('./routes/importMembers'));
// Notification endpoint used by other services (e.g., member portal) to notify staff
app.post('/api/notify/new-application', (req, res) => {
  try {
    const payload = req.body || {};
    console.log('Notify endpoint hit; payload:', JSON.stringify(payload));
    // Emit to all connected staff clients; also emit to role-specific room if provided
    io.emit('new_application', payload);
    if (payload && payload.notify_role) {
      io.to(String(payload.notify_role)).emit('new_application', payload);
      try {
        const roomSet = io.sockets.adapter.rooms.get(String(payload.notify_role));
        const clientsInRoom = roomSet ? roomSet.size : 0;
        console.log(`Emitted to room '${String(payload.notify_role)}' - clients in room: ${clientsInRoom}`);
      } catch (e) {
        console.warn('Could not inspect room set:', e);
      }
    }
    try {
      const totalClients = io.of('/').sockets.size;
      console.log('Total connected socket clients:', totalClients);
    } catch (e) {}
    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to emit new_application:', err);
    return res.status(500).json({ success: false, message: 'Failed to notify' });
  }
});

// Debug endpoint: return socket state (connected clients and rooms)
app.get('/api/debug/socket-state', (req, res) => {
  try {
    const totalClients = io.of('/').sockets.size;
    const rooms = [];
    for (const [roomName, sids] of io.sockets.adapter.rooms.entries()) {
      rooms.push({ roomName, clients: sids.size });
    }
    return res.json({ success: true, totalClients, rooms });
  } catch (err) {
    console.error('Failed to get socket state:', err);
    return res.status(500).json({ success: false, message: 'Failed to get socket state' });
  }
});

// Serve a simple static test page for socket connectivity
const path = require('path');
app.get('/test-socket', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-socket.html'));
});

// Debug: emit loan-approved for testing without modifying DB
app.post('/api/debug/emit-loan-approved', (req, res) => {
  try {
    const { member_number, application_id, message } = req.body || {};
    if (!member_number) return res.status(400).json({ success: false, message: 'member_number required' });
    const payload = { application_id: application_id || Date.now(), member_number, title: 'Loan Approved (debug)', message: message || 'Debug emit' };
    try {
      if (global && global.staffIo) {
        global.staffIo.emit('loan-approved', payload);
        console.log('Debug emitted loan-approved to all clients for member', member_number);
      } else {
        console.warn('Debug emit: staffIo not available');
      }
    } catch (e) {
      console.warn('Debug emit failed:', e && e.message ? e.message : e);
    }
    return res.json({ success: true, payload });
  } catch (err) {
    console.error('Error in debug emit endpoint:', err);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

server.listen(5000, () => {
  console.log('Server (with socket.io) is running on port 5000');
});