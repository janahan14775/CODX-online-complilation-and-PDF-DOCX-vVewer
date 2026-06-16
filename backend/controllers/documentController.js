const Document = require("../models/Document");

// Create Document
exports.createDocument = async (req, res) => {
  try {
    const { title, content, type } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Document title is required",
      });
    }

    const doc = await Document.create({
      title,
      content: content || "",
      type: type || "rich-text",
      owner: req.user.id,
    });

    res.status(201).json({
      success: true,
      document: doc,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error creating document",
    });
  }
};

// Get All User Documents
exports.getDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      documents: docs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error loading documents",
    });
  }
};

// Get Single Document
exports.getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      document: doc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error loading document",
    });
  }
};

// Update Document
exports.updateDocument = async (req, res) => {
  try {
    const { title, content, type } = req.body;

    const doc = await Document.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (title) doc.title = title;
    if (content !== undefined) doc.content = content;
    if (type) doc.type = type;

    await doc.save();

    res.json({
      success: true,
      document: doc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error updating document",
    });
  }
};

// Delete Document
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error deleting document",
    });
  }
};
