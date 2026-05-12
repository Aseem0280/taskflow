import { AnimatePresence, motion } from "framer-motion"

export default function Toast({ message }) {
  return (
    <div className="toast-wrap">
      <AnimatePresence>
        {message && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
