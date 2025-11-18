const Message = require('../models/Message');
const JobHome = require('../models/JobHome');

const getPersons = async (req, res) => {
  try {
    const { type, job_home_id } = req.query;

    if (!job_home_id) {
      return res.status(400).json({ success: false, message: 'job_home_id is required' });
    }

    const jobHome = await JobHome.findById(job_home_id).populate('customer').populate('jobCard');

    if (!jobHome) {
      return res.status(404).json({ success: false, message: 'Job home not found' });
    }

    let person = null;

    if (type === 'customer') {
      if (jobHome.customer) {
        person = {
          name: jobHome.customer.customer_name,
          contact_number: jobHome.customer.phone,
          type: 'customer'
        };
      }
    } else if (type === 'contact_person') {
      if (jobHome.jobCard) {
        person = {
          name: jobHome.jobCard.contact_person,
          contact_number: jobHome.jobCard.contact_number,
          type: 'contact_person'
        };
      }
    }

    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found or missing contact information' });
    }

    res.json({ success: true, person });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch person', error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { job_home_id, phoneno, person_number, message } = req.body;

    const newMessage = new Message({
      job_home_id,
      phoneno,
      person_number,
      message,
    });

    await newMessage.save();

    res.json({ success: true, message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $lookup: {
          from: 'jobhomes',
          localField: 'job_home_id',
          foreignField: '_id',
          as: 'jobHome'
        }
      },
      { $unwind: '$jobHome' },
      {
        $project: {
          _id: 1,
          job_home_id: 1,
          phoneno: 1,
          person_number: 1,
          message: 1,
          created_at: 1,
          updated_at: 1,
          job_no: '$jobHome.job_no'
        }
      },
      { $sort: { created_at: -1 } },
      { $limit: 20 }
    ]);

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }
};

const getMessageNotifications = async (req, res) => {
  try {
    let query = Message.find().populate('jobHome').sort({ created_at: -1 });

    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate + ' 00:00:00');
      const endDate = new Date(req.query.endDate + ' 23:59:59');
      query = query.where('created_at').gte(startDate).lte(endDate);
    }

    const messages = await query.limit(10);

    const formatted = messages.map(msg => ({
      id: msg._id,
      sender_name: 'System',
      subject: 'New Message',
      content: msg.message,
      created_at: msg.created_at,
      is_read: false,
      type: 'message',
      job_home_id: msg.job_home_id,
      job_no: msg.jobHome?.job_no,
    }));

    res.json({ success: true, messages: formatted, count: formatted.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch message notifications', error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete message', error: error.message });
  }
};

module.exports = { getPersons, sendMessage, getMessages, getMessageNotifications, deleteMessage };
